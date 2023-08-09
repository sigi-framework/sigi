import { reactive } from '@sigi/vue'
import type { ComponentOptions } from 'vue'

import { CommitsModule } from './commits.module'

export interface Props {
  size: number
  name: string
  msg: string
}

export const options: unknown = reactive(CommitsModule, {
  props: {
    size: Number,
    name: {
      type: String,
      default: '0',
      required: true,
    },
  },
  propsData: {
    msg: 'Hello',
  },
  data: function () {
    this.$mount
    this.size
    return {
      a: 1,
      currentBranch: 'master',
    }
  },

  computed: {
    aDouble(): number {
      return this.a * 2
    },
    aPlus: {
      get(): number {
        return this.a + 1
      },
      set(v: number) {
        this.a = v - 1
      },
      cache: false,
    },
  },

  filters: {
    truncate: function (v: string) {
      const newline = v.indexOf('\n')
      return newline > 0 ? v.slice(0, newline) : v
    },
    formatDate: function (v: string) {
      return v.replace(/T|Z/g, ' ')
    },
  },

  watch: {
    currentBranch(value: string) {
      value.toUpperCase()
    },
    a: {
      handler(_value: number) {},
      deep: true,
    },
  },

  methods: {
    onClick(_arg1: number, _arg2: string) {},
    plus(): void {
      this.a++
      this.aDouble.toFixed()
      this.aPlus = 1
      this.size.toFixed()
    },
  },

  created: function () {
    this.onClick(1, '2')
    this.fetchRepo(this.currentBranch)
  },
})
