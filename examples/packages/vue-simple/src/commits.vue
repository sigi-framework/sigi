<template>
<div id="demo">
  <h1>Latest Vue.js Commits</h1>
  <template v-for="branch in branches">
    <input type="radio"
      :id="branch"
      :value="branch"
      :key="branch"
      name="branch"
      v-model="currentBranch">
    <label :for="branch" :key="'label-' + branch">{{ branch }}</label>
  </template>
  <p>vuejs/vue@{{ currentBranch }}</p>
  <ul>
    <li v-for="record in commits" :key="record.commit.id">
      <a :href="record.html_url" target="_blank" class="commit">{{ record.sha.slice(0, 7) }}</a>
      - <span class="message">{{ record.commit.message | truncate }}</span><br>
      by <span class="author"><a :href="record.author.html_url" target="_blank">{{ record.commit.author.name }}</a></span>
      at <span class="date">{{ record.commit.author.date | formatDate }}</span>
    </li>
  </ul>
</div>
</template>
<script lang="ts">
import { reactive } from '@sigi/vue'

import { CommitsModule } from './commits.module'

export default reactive(CommitsModule, {
  data: function() {
    return {
      currentBranch: 'master',
    }
  },

  watch: {
    currentBranch: function(currentBranch: string) {
      this.fetchRepo(currentBranch)
    }
  },

  filters: {
    truncate: function (v: string) {
      const newline = v.indexOf('\n')
      return newline > 0 ? v.slice(0, newline) : v
    },
    formatDate: function (v: string) {
      return v.replace(/T|Z/g, ' ')
    }
  },

  created: function() {
    this.fetchRepo(this.currentBranch)
  },
})
</script>

<style lang="stylus" scoped>
#demo {
  font-family: 'Helvetica', Arial, sans-serif;
}
a {
  text-decoration: none;
  color: #f66;
}
li {
  line-height: 1.5em;
  margin-bottom: 20px;
}
.author, .date {
  font-weight: bold;
}
</style>