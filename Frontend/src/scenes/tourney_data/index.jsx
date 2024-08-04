import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";
const config = require('../../config.json');


const Tourney_Data = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [queryOptions, setQueryOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/tourneys/all`, {
        params: {
          paginationModel: JSON.stringify(queryOptions.paginationModel),
          filterModel: JSON.stringify(queryOptions.filterModel),
          sortModel: JSON.stringify(queryOptions.sortModel),
        },
      });
      setRows(response.data.players);
      setRowCount(response.data.total);
    } catch (error) {
      console.error("Error fetching players:", error);
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
    { field: "id", headerName: "ID" },
    {
      field: "tourney_name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "surface",
      headerName: "Surface",
      flex: 1,
    },
    {
      field: "num_match",
      headerName: "Amount of Matches",
      flex: 1,
    },
    {
      field: "tourney_level",
      headerName: "Tourney Level",
      flex: 1,
    },
    {
      field: "best_of",
      headerName: "Set Format",
      type: "number",
      headerAlign: "left",
      align: "left",
    }
  ];

  return (
    <Box m="20px">
      <Header title="Tournaments" subtitle="Explore an extensive list of annual and one-time events." />
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
          getRowId={(row) => row.id}
          paginationMode="server"
          filterMode="server"
          sortingMode="server"
          rowCount={rowCount}
          onFilterModelChange={onFilterChange}
          onPaginationModelChange={onPaginationModelChange}
          onSortModelChange={onSortModelChange}
          pageSizeOptions={[10, 25, 50]}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default Tourney_Data;