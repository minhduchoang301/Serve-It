import React, { useState, useEffect, useCallback } from "react";
import { Box, Hidden, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Link } from 'react-router-dom';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";
const config = require('../../config.json');


const Player_Data = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [queryOptions, setQueryOptions] = useState({});
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/players/all`, {
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
    { field: "player_id", headerName: "ID" },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: (params) => (
        <Link 
          to={`/player/${params.row.player_id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "dob",
      headerName: "Date of Birth",
      flex: 1,
    },
    {
      field: "hand",
      headerName: "Hand",
      flex: 1,
    },
    {
      field: "ioc",
      headerName: "Country",
      flex: 1,
    },
    {
      field: "height",
      headerName: "Height",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "is_atp",
      headerName: "ATP",
      type: "boolean",
      flex: 1,
    },
  ];

  return (
    <Box m="20px">
      <Header title="Players" subtitle="List of Tennis Players" />
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
          getRowId={(row) => row.player_id}
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

export default Player_Data;