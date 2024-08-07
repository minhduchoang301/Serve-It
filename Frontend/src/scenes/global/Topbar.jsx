import React, { useState, useEffect, useContext } from "react";
import { Box, IconButton, useTheme } from "@mui/material";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import Autocomplete from "@mui/material/Autocomplete";
import config from "../../config";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const navigate = useNavigate();

  const searchPlayers = async (term) => {
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/search-players`, {
        params: { term }
      });
      setOptions(response.data);
    } catch (error) {
      console.error("Error searching players:", error);
    }
  };

  const debouncedSearch = debounce(searchPlayers, 300);

  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
    } else {
      setOptions([]);
    }
  }, [searchTerm]);

  const handleInputChange = (event, value) => {
    setSearchTerm(value);
  };

  const handleSelectPlayer = (event, value) => {
    if (value) {
      navigate(`/player/${value.player_id}`);
    }
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
        width="100%"
        maxWidth="300px"
        alignItems="center"
        justifyContent={"space-between"}
      >
       <Autocomplete
  freeSolo
  options={options}
  getOptionLabel={(option) => option.name || ""}
  renderInput={(params) => (
    <InputBase
      {...params.InputProps}
      sx={{
        ml: 2,
        flex: 1,
        width: "250px",
        "& .MuiAutocomplete-input": {
          padding: "0 !important",
        }
      }}
      placeholder="Search"
      inputProps={{
        ...params.inputProps,
        "aria-label": "search",
      }}
    />
  )}
  onInputChange={handleInputChange}
  onChange={handleSelectPlayer}
  filterOptions={(x) => x}
  renderOption={(props, option) => (
    <li {...props} style={{ padding: "8px 16px" }}>
      {option.name}
    </li>
  )}
  loading={searchTerm.trim() !== '' && options.length === 0}
  loadingText="Searching..."
/>
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;