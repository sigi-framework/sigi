import * as ts from 'typescript'
import { Maybe } from '@sigi/types'

const EffectLibraryName = '@sigi/core'
const EffectName = 'Effect'
const PayloadGetterName = 'payloadGetter'

enum ImportType {
  Namespace,
  Named,
}

interface ImportDeclarationCheckResult {
  importName: string
  kind: ImportType
}

export const SigiTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  let result: Maybe<ImportDeclarationCheckResult> = null

  const visitor: ts.Visitor = (node) => {
    if (ts.isSourceFile(node)) {
      return ts.visitEachChild(node, visitor, context)
    }
    if (ts.isImportDeclaration(node)) {
      result = result ?? checkImportDeclaration(node)
      return node
    } else {
      if (!result) {
        return node
      } else {
        const { decorators } = node
        if (ts.isMethodDeclaration(node) && decorators && decorators.length) {
          let hasModifiedDecorator = false
          const modifiedDecorators = decorators.map((decorator) => {
            const isEffectDecorator = checkDecorator(decorator, result!)
            if (isEffectDecorator) {
              const expression = decorator.expression as ts.CallExpression
              const argument = expression.arguments.length ? expression.arguments[0] : null
              if (!argument) {
                return decorator
              }
              if (!ts.isObjectLiteralExpression(argument)) {
                throw new TypeError('Only support object literal parameter in SSREffect')
              }
              hasModifiedDecorator = true
              return ts.updateDecorator(
                decorator,
                ts.updateCall(expression, expression.expression, expression.typeArguments, [
                  ts.updateObjectLiteral(
                    argument,
                    argument.properties.filter(
                      (property) =>
                        !ts.isPropertyAssignment(property) && property.name?.getText() !== PayloadGetterName,
                    ),
                  ),
                ]),
              )
            }
            return decorator
          })
          if (hasModifiedDecorator) {
            return ts.updateMethod(
              node,
              modifiedDecorators,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.questionToken,
              node.typeParameters,
              node.parameters,
              node.type,
              node.body,
            )
          }
          return node
        }
      }
    }

    return ts.visitEachChild(node, visitor, context)
  }

  return (node) => ts.visitNode(node, visitor)
}

function checkImportDeclaration(node: ts.ImportDeclaration): Maybe<ImportDeclarationCheckResult> {
  if ((node.moduleSpecifier as ts.StringLiteral).text === EffectLibraryName) {
    const nameBindings = node.importClause?.namedBindings
    if (!nameBindings) {
      return null
    }
    if (ts.isNamespaceImport(nameBindings)) {
      return { importName: nameBindings.name.getText(), kind: ImportType.Namespace }
    }
    let effectImport = nameBindings.elements.find(
      (element) => element.getText() === EffectName && !element.propertyName,
    )
    if (effectImport) {
      return { importName: EffectName, kind: ImportType.Named }
    }
    effectImport = nameBindings.elements.find((element) => element.propertyName?.getText() === EffectName)
    if (effectImport) {
      return { importName: effectImport.name.getText(), kind: ImportType.Named }
    }
  }
  return null
}

function checkDecorator(decorator: ts.Decorator, importCheckResult: ImportDeclarationCheckResult) {
  const { expression } = decorator
  if (ts.isCallExpression(expression)) {
    const { expression: childExpression } = expression
    if (importCheckResult.kind === ImportType.Namespace) {
      return (
        ts.isPropertyAccessExpression(childExpression) &&
        ts.isIdentifier(childExpression.expression) &&
        childExpression.expression.getText() === importCheckResult.importName &&
        childExpression.name.getText() === EffectName
      )
    } else {
      return ts.isIdentifier(childExpression) && childExpression.getText() === importCheckResult?.importName
    }
  }
}
