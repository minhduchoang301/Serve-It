import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import MySidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Player_Data from "./scenes/player_data";
import Tourney_Data from "./scenes/tourney_data";
import Match_Data from "./scenes/match_data";
import SwarmPlotPage from "./scenes/surface_swarm";
import GalaxyPage from "./scenes/goat_galaxy/goat_galaxy";
import TimeSeriesPage from "./scenes/time_series";
import PlayerSearchPage from "./scenes/PlayerBetting";
import BettingDashboard from "./scenes/bettingDashboard";
import PlayerPage from "./scenes/player";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <MySidebar isSidebar={isSidebar} />
          <main className="content">
            <Topbar setIsSidebar={setIsSidebar} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/player_data" element={<Player_Data />} />
              <Route path="/tourney_data" element={<Tourney_Data />} />
              <Route path="/match_data" element={<Match_Data />} />
              <Route path="/surface_swarm" element={<SwarmPlotPage />} />
              <Route path="/goat_galaxy" element={<GalaxyPage />} />
              <Route path="/time_series" element={<TimeSeriesPage />} />
              <Route path="/player/:player_id" element={<PlayerPage />} />
              <Route path="/betting" element={<BettingDashboard />} />
              <Route path="/player_betting" element={<PlayerSearchPage />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;