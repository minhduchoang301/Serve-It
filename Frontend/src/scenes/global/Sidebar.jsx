import { useState } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
/* import "react-pro-sidebar/dist/css/styles.css"; */
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PersonIcon from '@mui/icons-material/Person';

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => {
        setSelected(title);
        navigate(to);
      }}
      icon={icon}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

const MySidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  return (  
    <Box
      sx={{
        "& .ps-sidebar-root": {
          background: theme.palette.primaryLight,
          height: "100%",
        },
        "& .ps-menu-button.ps-active": {
          backgroundColor: theme.palette.primary,
        },
        "& .ps-menu-button:hover": {
        backgroundColor: theme.palette.primaryLight + "!important", // Use primary[300] for a subtle hover effect
        },
        "& .pro-sidebar-inner": {
          background: `${theme.palette.primaryLight} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "2px 25px 5px 20px !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <Sidebar collapsed={isCollapsed} 
        backgroundColor= {theme.palette.primaryLight}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  Serve-It
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Home"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            {isCollapsed ? (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px", textAlign: "center" }}
              >
              </Typography>
            ) : (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Data
              </Typography>
            )}
            <Item
              title="Players"
              to="/player_data"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Matches"
              to="/match_data"
              icon={<SportsTennisIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Tournaments"
              to="/tourney_data"
              icon={<EmojiEventsIcon />}
              selected={selected}
              setSelected={setSelected}
            />
                        {isCollapsed ? (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px", textAlign: "center" }}
              >
              </Typography>
            ) : (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                NetGenius
              </Typography>
            )}
            <Item
              title="Surface Analysis"
              to="/surface_swarm"
              icon={<ScatterPlotIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Goat Galaxy"
              to="/goat_galaxy"
              icon={<RocketLaunchIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Betting Dashboard"
              to="/betting"
              icon={<TimelineOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Player Analysis"
              to="/player_betting"
              icon={<PersonIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </Box>
        </Menu>
      </Sidebar>
    </Box>
  );
};

export default MySidebar;