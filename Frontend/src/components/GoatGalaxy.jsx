import React, { useState } from 'react';
import { ResponsiveCirclePacking } from '@nivo/circle-packing'
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useNavigate } from 'react-router-dom';

const TennisPlayerGalaxy = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [zoomedId, setZoomedId] = useState(null);
  const navigate = useNavigate();

  // Define colors for each surface
  const surfaceColors = {
    'Hard': ['#cfe2f3', '#9fc5e8', '#6fa8dc', '#3d85c6', '#0b5394'],
    'Clay': ['#f4cccc', '#ea9999', '#e06666', '#cc0000', '#990000'],
    'Grass': ['#d9ead3', '#b6d7a8', '#93c47d', '#6aa84f', '#38761d'],
    'Carpet': ['#ead1dc', '#d5a6bd', '#c27ba0', '#a64d79', '#741b47']
  };

  // Transform the data to the format expected by Nivo CirclePacking
  const transformData = (inputData) => {
    if (!inputData || inputData.length === 0) {
      return { id: 'root', name: 'No Data', children: [] };
    }

    const surfaces = ['Hard', 'Clay', 'Grass', 'Carpet'];
    return {
      id: 'root',
      name: 'Tennis Players',
      children: surfaces.map(surface => ({
        id: surface,
        name: surface,
        color: surfaceColors[surface][2], // Use middle color for surface
        children: inputData
          .filter(player => player.surface === surface)
          .map(player => ({
            id: `${player.player_name}-${player.surface}`,
            name: player.player_name,
            synthetic_score: player.synthetic_score,
            player_id: player.player_id,
            color: surfaceColors[surface][Math.floor(player.synthetic_score / 3000)] // Use gradient based on score
          }))
      })).filter(surface => surface.children.length > 0) // Remove surfaces with no players
    };
  };

  const handleNodeClick = (node) => {
    if (node.data.player_id) {
      navigate(`/player/${node.data.player_id}`);
    } else if (node.id === zoomedId) {
      setZoomedId(node.parent ? node.parent.id : null);
    } else {
      setZoomedId(node.id);
    }
  };

  const transformedData = transformData(data);
  if (transformedData.children.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <ResponsiveCirclePacking
      data={transformedData}
      leavesOnly={true}
      margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
      id="id"
      value="synthetic_score"
      colors={node => node.data.color}
      childColor={node => node.data.color}
      padding={4}
      enableLabels={true}
      labelsFilter={n => 1 === n.node.depth} // Only show labels for surface nodes
      labelsSkipRadius={10}
      labelTextColor={{
        from: 'color',
        modifiers: [['darker', 2]]
      }}
      borderWidth={1}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 0.5]]
      }}
      zoomedId={zoomedId}
      onClick={handleNodeClick}
      theme={{
        tooltip: {
          container: {
            background: colors.primary[400],
            color: colors.grey[100],
            fontSize: 12,
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          },
        },
      }}
      tooltip={({ id, value, color }) => (
        <div style={{ background: colors.primary[400], color: colors.grey[100], padding: '8px', borderRadius: '4px' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>{id}</strong>
          <span>Synthetic Score: {value ? value.toFixed(2) : 'N/A'}</span>
        </div>
      )}
      motionConfig={{
        mass: 10,
        tension: 300,
        friction: 90,
        clamp: false,
        precision: 0.01,
        velocity: 0
    }}
    />
  );
}

export default TennisPlayerGalaxy;