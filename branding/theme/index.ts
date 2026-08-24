import DefaultTheme from "vitepress/theme"
import type { Theme } from "vitepress"
import { h, defineComponent } from "vue"
import { useData, useRoute } from "vitepress"

import "./styles/variables.css"
import "./styles/custom.css"

import VPButton from "./components/VPButton.vue"
import VPCard from "./components/VPCard.vue"
import VPBadge from "./components/VPBadge.vue"
import VPAlert from "./components/VPAlert.vue"
import VPTabs from "./components/VPTabs.vue"
import VPCodeGroup from "./components/VPCodeGroup.vue"
import VPFooter from "./components/VPFooter.vue"
import VPNavBar from "./components/VPNavBar.vue"
import VPSidebar from "./components/VPSidebar.vue"
import VPHomeHero from "./components/VPHomeHero.vue"
import VPFeatures from "./components/VPFeatures.vue"
import VPSoundToggle from "./components/VPSoundToggle.vue"
import VPWaveform from "./components/VPWaveform.vue"

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    name: "ReposellLayout",
    setup() {
      const { frontmatter } = useData()
      const route = useRoute()

      const isHome = frontmatter.value?.layout === "home"
      const isLanding = frontmatter.value?.layout === "landing"

      return () => {
        if (isHome || isLanding) {
          return h(DefaultTheme.Layout, null, {
            "home-hero": () => h(VPHomeHero),
            "features": () => h(VPFeatures),
          })
        }

        return h(DefaultTheme.Layout, null, {
          "nav-bar": () => h(VPNavBar),
          "sidebar": () => h(VPSidebar),
          "footer": () => h(VPFooter),
        })
      }
    },
  }),
  enhanceApp({ app }) {
    app.component("VPButton", VPButton)
    app.component("VPCard", VPCard)
    app.component("VPBadge", VPBadge)
    app.component("VPAlert", VPAlert)
    app.component("VPTabs", VPTabs)
    app.component("VPCodeGroup", VPCodeGroup)
    app.component("VPWaveform", VPWaveform)
  },
} satisfies Theme