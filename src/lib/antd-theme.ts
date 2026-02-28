import type { ThemeConfig } from 'antd';

/** EZRoom design tokens – matches index.css (Tailwind) for consistent look with antd components */
export const ezRoomTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2FA4A9',
    colorSuccess: '#22c55e',
    colorWarning: '#F2994A',
    colorError: '#DC2626',
    colorInfo: '#2FA4A9',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FAF7F2',
    colorBorder: '#E8E4DE',
    colorText: '#333333',
    colorTextSecondary: '#6B6B6B',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    fontSize: 14,
    motionDurationSlow: '0.2s',
    motionDurationMid: '0.15s',
    motionDurationFast: '0.1s',
    controlHeight: 40,
    controlHeightLG: 48,
  },
  components: {
    Button: {
      borderRadius: 12,
      fontWeight: 600,
      primaryShadow: '0 2px 4px rgb(47 164 169 / 0.2)',
      defaultShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
    },
    Input: {
      borderRadius: 12,
      activeBorderColor: '#2FA4A9',
      hoverBorderColor: '#2FA4A9',
    },
    Select: {
      borderRadius: 12,
      optionSelectedBg: 'rgba(47, 164, 169, 0.08)',
    },
    Card: {
      borderRadiusLG: 16,
    },
    Drawer: {
      padding: 20,
    },
    Badge: {
      colorBgContainer: '#FFFFFF',
    },
  },
};
