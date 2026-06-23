import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#dcfbf1',
    100: '#aef3df',
    200: '#7eebcb',
    300: '#4ee4b7',
    400: '#2bdcab',
    500: '#16c294',
    600: '#0c9772',
    700: '#036c50',
    800: '#00422f',
    900: '#001911',
  },
  tez: {
    400: '#4f8cf7',
    500: '#2a7cf6',
    600: '#1f63cf',
  },
};

const glass = {
  bg: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
};

const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`,
  },
  styles: {
    global: {
      'html, body, #root': { height: '100%' },
      body: {
        bg: '#070a0e',
        color: 'whiteAlpha.900',
        backgroundImage:
          'radial-gradient(1100px 560px at 82% -12%, rgba(43,220,171,0.12), transparent 60%), radial-gradient(900px 520px at -5% 8%, rgba(42,124,246,0.10), transparent 55%)',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      },
      '::selection': { background: 'rgba(43,220,171,0.30)' },
      '*::-webkit-scrollbar': { width: '10px', height: '10px' },
      '*::-webkit-scrollbar-track': { background: 'transparent' },
      '*::-webkit-scrollbar-thumb': {
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '8px',
        border: '2px solid transparent',
        backgroundClip: 'content-box',
      },
    },
  },
  components: {
    Button: {
      baseStyle: { fontWeight: 600, borderRadius: 'xl', letterSpacing: '0.01em' },
      variants: {
        brand: {
          bg: 'brand.400',
          color: '#04130d',
          _hover: { bg: 'brand.300', _disabled: { bg: 'brand.400' } },
          _active: { bg: 'brand.500' },
        },
        glass: {
          ...glass,
          color: 'white',
          _hover: { bg: 'rgba(255,255,255,0.08)' },
        },
        ghostline: {
          bg: 'transparent',
          color: 'whiteAlpha.800',
          border: '1px solid rgba(255,255,255,0.10)',
          _hover: { bg: 'whiteAlpha.100', color: 'white' },
        },
      },
    },
    Heading: { baseStyle: { letterSpacing: '-0.02em' } },
    Tooltip: {
      baseStyle: {
        bg: '#1a212c',
        color: 'whiteAlpha.900',
        borderRadius: 'lg',
        border: '1px solid rgba(255,255,255,0.08)',
        px: 3,
        py: 2,
      },
    },
  },
});

export const glassStyle = glass;
export default theme;
