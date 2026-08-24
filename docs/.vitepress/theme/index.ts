import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import '../../../../branding/theme/styles/variables.css'
import '../../../../branding/theme/styles/custom.css'
import './styles/home.css'
import './themes/glitch.css'

import ReposellLayout from './ReposellLayout.vue'

import VPButton from '../../../../branding/theme/components/VPButton.vue'
import VPCard from '../../../../branding/theme/components/VPCard.vue'
import VPBadge from '../../../../branding/theme/components/VPBadge.vue'
import VPAlert from '../../../../branding/theme/components/VPAlert.vue'
import VPTabs from '../../../../branding/theme/components/VPTabs.vue'
import VPCodeGroup from '../../../../branding/theme/components/VPCodeGroup.vue'
import VPWaveform from '../../../../branding/theme/components/VPWaveform.vue'
import VPTerminal from '../../../../branding/theme/components/VPTerminal.vue'
import VPCalculator from '../../../../branding/theme/components/VPCalculator.vue'
import HomeInstallTabs from './components/HomeInstallTabs.vue'
import HomeAudit from './components/HomeAudit.vue'
import HomeCopyChip from './components/HomeCopyChip.vue'
import FaultyTerminal from './components/FaultyTerminal.vue'
import HeroBackground from './components/HeroBackground.vue'
import LandingHero from './components/LandingHero.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import VersionChip from './components/VersionChip.vue'
import FooterWordmark from './components/FooterWordmark.vue'

export default {
  extends: DefaultTheme,
  Layout: ReposellLayout,
  enhanceApp({ app }) {
    app.component('VPButton', VPButton)
    app.component('VPCard', VPCard)
    app.component('VPBadge', VPBadge)
    app.component('VPAlert', VPAlert)
    app.component('VPTabs', VPTabs)
    app.component('VPCodeGroup', VPCodeGroup)
    app.component('VPWaveform', VPWaveform)
    app.component('VPTerminal', VPTerminal)
    app.component('VPCalculator', VPCalculator)
    app.component('HomeInstallTabs', HomeInstallTabs)
    app.component('HomeAudit', HomeAudit)
    app.component('HomeCopyChip', HomeCopyChip)
    app.component('FaultyTerminal', FaultyTerminal)
    app.component('HeroBackground', HeroBackground)
    app.component('LandingHero', LandingHero)
    app.component('ThemeSwitcher', ThemeSwitcher)
    app.component('VersionChip', VersionChip)
    app.component('FooterWordmark', FooterWordmark)
  },
} satisfies Theme
