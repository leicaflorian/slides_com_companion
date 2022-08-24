<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="view-now">Current</div>
        <div class="view-next">Upcoming</div>
      </div>
      <div class="col">
        <div class="speaker-notes-container">
          speaker notes

        </div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup () {

    return {}
  }
})
</script>

<style lang="scss">
@import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";

:root {
  --primary: #e6637c;
}


</style>
