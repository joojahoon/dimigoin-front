<script>
export default {
  name: 'DimiBadge',

  props: {
    color: {
      type: String,
      default: 'aloes',
      validator: c => ['cyan', 'aloes', 'orange', 'gray'].includes(c)
    }
  },

  computed: {
    computedClass () {
      return ['badge', 'badge--' + this.color]
    }
  }
}
</script>

<template>
  <div :class="computedClass">
    <slot />
  </div>
</template>

<style lang="scss">
@import '../scss/vars';

.badge {
  padding: 0.5em 1.1em;
  border-radius: 20px;
  font-size: 14px;
  line-height: 0.86;
  text-align: center;

  &--aloes {
    background-color: $aloes;
    box-shadow: 0 5px 15px rgba(0, 180, 162, 0.41);
    color: $white;
  }

  &--orange {
    background-color: $orange;
    box-shadow: 0 5px 15px rgba(245, 105, 61, 0.41);
    color: $white;
  }

  &--gray {
    background-color: $gray-lighter;
    box-shadow: 0 5px 15px rgba(231, 231, 231, 0.41);
    color: $gray-dark;
  }

  &--cyan {
    background-color: $cyan;
    box-shadow: 0 5px 15px rgba(17, 157, 230, 0.41);
    color: $white;
  }
}
</style>
