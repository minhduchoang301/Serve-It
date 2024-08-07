import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";

const config = require('../../config.json');

const Match_Data = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [queryOptions, setQueryOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/matches/all`, {
        params: {
          paginationModel: JSON.stringify(queryOptions.paginationModel),
          filterModel: JSON.stringify(queryOptions.filterModel),
          sortModel: JSON.stringify(queryOptions.sortModel),
        },
      });
      setRows(response.data.matches);
      setRowCount(response.data.total);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  }, [queryOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onFilterChange = useCallback((filterModel) => {
    setQueryOptions((prevOptions) => ({
      ...prevOptions,
      filterModel: { ...filterModel },
    }));
  }, []);

  const onPaginationModelChange = useCallback((paginationModel) => {
    setQueryOptions((prevOptions) => ({
      ...prevOptions,
      paginationModel: { ...paginationModel },
    }));
  }, []);

  const onSortModelChange = useCallback((sortModel) => {
    setQueryOptions((prevOptions) => ({
      ...prevOptions,
      sortModel: [...sortModel],
    }));
  }, []);

  const columns = [
    { field: "winner_name", headerName: "Winner", flex: 1, cellClassName: "name-column--cell" },
    { field: "winner_rank", headerName: "Winner Rank", type: "number", flex: 1 },
    { field: "loser_name", headerName: "Loser", flex: 1, cellClassName: "name-column--cell" },
    { field: "loser_rank", headerName: "Loser Rank", type: "number", flex: 1 },
    { field: "score", headerName: "Score", flex: 1 },
    { field: "tourney_name", headerName: "Tournament", flex: 1 },
    { field: "tourney_date", headerName: "Date", flex: 1 },
    { field: "minutes", headerName: "Duration (mins)", type: "number", flex: 1 },
    { field: "winner_aces", headerName: "Winner Aces", type: "number", flex: 1 },
    { field: "loser_aces", headerName: "Loser Aces", type: "number", flex: 1 },
    { field: "winner_double_faults", headerName: "Winner Double Faults", type: "number", flex: 1 },
    { field: "loser_double_faults", headerName: "Loser Double Faults", type: "number", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="Match Data" subtitle="Explore detailed information about tennis matches." />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => `${row.winner_name}-${row.loser_name}-${row.tourney_date}`}
          paginationMode="server"
          filterMode="server"
          sortingMode="server"
          rowCount={rowCount}
          onFilterModelChange={onFilterChange}
          onPaginationModelChange={onPaginationModelChange}
          onSortModelChange={onSortModelChange}
          pageSizeOptions={[10, 25, 50]}
          loading={loading}
          components={{
            Toolbar: GridToolbar,
          }}
        />
      </Box>
    </Box>
  );
};

export default Match_Data;