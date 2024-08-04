import { useTheme } from "@emotion/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { tokens } from "../../theme";

const LoadingScreen = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
  
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} sx={{ color: colors.greenAccent[500] }} />
        <Typography variant="h4" sx={{ mt: 2, color: colors.grey[100] }}>
          Loading Player Data...
        </Typography>
      </Box>
    );
  };

  export default LoadingScreen;