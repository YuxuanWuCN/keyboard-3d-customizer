import { KeycapThemePreset } from '../types/theme';

export const THEME_PRESETS: Record<string, KeycapThemePreset> = {
  retro_9009: {
    id: 'retro_9009',
    name: '9009 复古灰白 (Classic Retro)',
    description: '标志性米白与浅灰工业风，点缀复古鼠尾草绿与珊瑚红个性键。',
    designer: 'Cherry / Classic Vintage',
    palette: {
      alphas: { top: '#E3DFD5', legend: '#2B2D2F' },
      modifiers: { top: '#C1BEB5', legend: '#2B2D2F' },
      accents: { top: '#7B9A7B', legend: '#FFFFFF' },
      spacebar: { top: '#E3DFD5', legend: '#2B2D2F' }
    },
    recommendedCase: '#EAE6DF',
    recommendedWeight: 'brass_pvd',
    defaultMaterial: 'pbt'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: '赛博朋克 2077 (Cyberpunk)',
    description: '反乌托邦高反差霓虹亮黄主键区，搭配电光青色与热烈粉红个性。',
    designer: 'Night City Syndicate',
    palette: {
      alphas: { top: '#FCEE0A', legend: '#0A0A0A' },
      modifiers: { top: '#00F0FF', legend: '#05101E' },
      accents: { top: '#FF0055', legend: '#FFFFFF' },
      spacebar: { top: '#FCEE0A', legend: '#0A0A0A' }
    },
    recommendedCase: '#12131A',
    recommendedWeight: 'mirror_chroma',
    defaultMaterial: 'abs'
  },
  miami_nights: {
    id: 'miami_nights',
    name: '迈阿密风云 (Miami Nights)',
    description: '午夜深黑底色碰撞霓虹青色与荧光洋红，复古合成波美学。',
    designer: 'Outrun Synthwave',
    palette: {
      alphas: { top: '#181A20', legend: '#00FFFF' },
      modifiers: { top: '#1F222A', legend: '#FF1493' },
      accents: { top: '#FF1493', legend: '#FFFFFF' },
      spacebar: { top: '#00FFFF', legend: '#181A20' }
    },
    recommendedCase: '#3B185F',
    recommendedWeight: 'mirror_chroma',
    defaultMaterial: 'abs'
  },
  dark_stealth: {
    id: 'dark_stealth',
    name: '隐士深黑 (Dark Stealth)',
    description: '全黑极简战术纯黑风格，低调深灰字符搭配一抹暗红个性点缀。',
    designer: 'Monochrome Studio',
    palette: {
      alphas: { top: '#1E2024', legend: '#4B515D' },
      modifiers: { top: '#141518', legend: '#3A3F49' },
      accents: { top: '#DC2626', legend: '#FFFFFF' },
      spacebar: { top: '#1E2024', legend: '#4B515D' }
    },
    recommendedCase: '#0D0E11',
    recommendedWeight: 'matte_black',
    defaultMaterial: 'pbt'
  },
  eva_01: {
    id: 'eva_01',
    name: 'EVA 初号机 (Test Type 01)',
    description: '经典初号机高饱和紫绿机甲配色，搭配亮橙警示增补按键。',
    designer: 'NERV Tokyo-3',
    palette: {
      alphas: { top: '#5C2D91', legend: '#00FF66' },
      modifiers: { top: '#3E1B6B', legend: '#FF6600' },
      accents: { top: '#00FF66', legend: '#1A1A1A' },
      spacebar: { top: '#FF6600', legend: '#FFFFFF' }
    },
    recommendedCase: '#4F237A',
    recommendedWeight: 'anodized_gold',
    defaultMaterial: 'abs'
  },
  matcha_latte: {
    id: 'matcha_latte',
    name: '抹茶拿铁 (Matcha Milk)',
    description: '治愈系抹茶柔绿与温润奶白结合，自然静谧的植物森系质感。',
    designer: 'Zen Botanical',
    palette: {
      alphas: { top: '#F5F2EB', legend: '#2B4236' },
      modifiers: { top: '#8FA391', legend: '#F5F2EB' },
      accents: { top: '#385A48', legend: '#FFFFFF' },
      spacebar: { top: '#8FA391', legend: '#F5F2EB' }
    },
    recommendedCase: '#2F4838',
    recommendedWeight: 'brass_pvd',
    defaultMaterial: 'pbt'
  },
  olivia: {
    id: 'olivia',
    name: '奥利维亚玫瑰金 (Olivia)',
    description: '高奢哑黑与温润奶白主调，点缀优雅柔和的玫瑰粉金大键。',
    designer: 'Olivia Design',
    palette: {
      alphas: { top: '#EDEBE6', legend: '#242424' },
      modifiers: { top: '#1F1F1F', legend: '#E5B2B7' },
      accents: { top: '#E5B2B7', legend: '#242424' },
      spacebar: { top: '#E5B2B7', legend: '#242424' }
    },
    recommendedCase: '#F0EEE9',
    recommendedWeight: 'brass_pvd',
    defaultMaterial: 'abs'
  }
};
