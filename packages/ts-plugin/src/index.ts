import { Maybe } from '@sigi/types'
import * as ts from 'typescript'

const EffectLibraryName = '@sigi/core'
const EffectName = 'Effect'
const PayloadGetterName = 'payloadGetter'
const ModuleDef = 'Module'

type ImportCheckType = typeof ModuleDef | typeof EffectName

enum ImportType {
  Namespace,
  Named,
}

interface ImportDeclarationCheckResult {
  importName: string
  kind: ImportType
}

export const SigiTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  let effectImportResult: Maybe<ImportDeclarationCheckResult> = null
  let moduleImportResult: Maybe<ImportDeclarationCheckResult> = null
  const visitor: ts.Visitor = (node) => {
    if (ts.isSourceFile(node)) {
      return ts.visitEachChild(node, visitor, context)
    }
    if (ts.isImportDeclaration(node)) {
      effectImportResult = effectImportResult ?? checkImportDeclaration(node, EffectName)
      moduleImportResult = moduleImportResult ?? checkImportDeclaration(node, ModuleDef)
      return node
    } else {
      if (!effectImportResult && !moduleImportResult) {
        return node
      } else {
        const { decorators } = node
        if (effectImportResult && ts.isMethodDeclaration(node) && decorators && decorators.length) {
          let hasModifiedDecorator = false
          const modifiedDecorators = decorators.map((decorator) => {
            const isEffectDecorator = checkDecorator(decorator, effectImportResult!, EffectName)
            if (isEffectDecorator) {
              const expression = decorator.expression as ts.CallExpression
              const argument = expression.arguments.length ? expression.arguments[0] : null
              if (!argument) {
                return decorator
              }
              if (!ts.isObjectLiteralExpression(argument)) {
                throw new TypeError('Only support object literal parameter in Effect decorator')
              }
              hasModifiedDecorator = true
              return ts.factory.updateDecorator(
                decorator,
                ts.factory.updateCallExpression(expression, expression.expression, expression.typeArguments, [
                  ts.factory.updateObjectLiteralExpression(
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
            return ts.factory.updateMethodDeclaration(
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
        } else if (
          process.env.NODE_ENV === 'development' &&
          moduleImportResult &&
          ts.isClassDeclaration(node) &&
          decorators &&
          decorators.length
        ) {
          let sigiModuleName: string | null = null
          decorators.forEach((decorator) => {
            if (checkDecorator(decorator, moduleImportResult!, ModuleDef)) {
              const arg = (decorator.expression as ts.CallExpression).arguments[0]
              sigiModuleName = (arg as ts.StringLiteral).text
            }
          })
          if (sigiModuleName) {
            return [node, createHMRCode(sigiModuleName, node.name!.getText())]
          }
          return node
        }
      }
    }

    return ts.visitEachChild(node, visitor, context)
  }

  return (node) => ts.visitNode(node, visitor)
}

function checkImportDeclaration(
  node: ts.ImportDeclaration,
  name: ImportCheckType,
): Maybe<ImportDeclarationCheckResult> {
  if ((node.moduleSpecifier as ts.StringLiteral).text === EffectLibraryName) {
    const nameBindings = node.importClause?.namedBindings
    if (!nameBindings) {
      return null
    }
    if (ts.isNamespaceImport(nameBindings)) {
      return { importName: nameBindings.name.getText(), kind: ImportType.Namespace }
    }
    let effectImport = nameBindings.elements.find((element) => element.getText() === name && !element.propertyName)
    if (effectImport) {
      return { importName: name, kind: ImportType.Named }
    }
    effectImport = nameBindings.elements.find((element) => element.propertyName?.getText() === name)
    if (effectImport) {
      return { importName: effectImport.name.getText(), kind: ImportType.Named }
    }
  }
  return null
}

function checkDecorator(
  decorator: ts.Decorator,
  importCheckResult: ImportDeclarationCheckResult,
  name: ImportCheckType,
) {
  const { expression } = decorator
  if (ts.isCallExpression(expression)) {
    const { expression: childExpression } = expression
    if (importCheckResult.kind === ImportType.Namespace) {
      return (
        ts.isPropertyAccessExpression(childExpression) &&
        ts.isIdentifier(childExpression.expression) &&
        childExpression.expression.getText() === importCheckResult.importName &&
        childExpression.name.getText() === name
      )
    } else {
      return ts.isIdentifier(childExpression) && childExpression.getText() === importCheckResult?.importName
    }
  }
  return false
}

function createHMRCode(moduleName: string, moduleClassName: string) {
  const template = `
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    const { rootInjector } = require('@sigi/di')
    const instance = rootInjector.getInstance(${moduleClassName})
    Module.removeModule('${moduleName}', instance)
  })
}
`
  const source = ts.createSourceFile('hmr', template, ts.ScriptTarget.ES2018, false, ts.ScriptKind.JS)
  return source.statements[0]
}
