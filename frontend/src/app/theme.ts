import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f4b7a',
    },
    secondary: {
      main: '#0f766e',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    divider: '#e4e8ef',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
    },
    h6: {
      fontSize: '1.05rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.45,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
        sizeSmall: {
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          height: 24,
        },
        label: {
          paddingLeft: 8,
          paddingRight: 8,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'rgba(0, 0, 0, 0.6)',
          backgroundColor: '#f8fafc',
          borderBottomColor: '#e4e8ef',
          lineHeight: 1.4,
        },
        body: {
          borderBottomColor: '#e4e8ef',
        },
      },
    },
  },
})
