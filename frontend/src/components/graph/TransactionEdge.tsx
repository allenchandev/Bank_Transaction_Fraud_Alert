'use client';

import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

interface CustomEdgeData {
  amount: number;
  txCount: number;
  isCycleEdge: boolean;
  isBFSPath?: boolean;
}

export const TransactionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  const edgeData = data as unknown as CustomEdgeData | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isCycle = edgeData?.isCycleEdge;
  const isBFS = edgeData?.isBFSPath;

  let strokeColor = '#94a3b8';
  let strokeWidth = 1.5;

  if (isCycle) {
    strokeColor = '#ea580c';
    strokeWidth = 2.5;
  } else if (isBFS) {
    strokeColor = '#2563eb';
    strokeWidth = 2.5;
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isCycle || isBFS ? '5 5' : undefined,
        }}
        className={isCycle ? 'cycle-pulse-edge' : ''}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-xs cursor-pointer transition hover:scale-105 ${
              isCycle
                ? 'bg-orange-600 text-white shadow-sm'
                : isBFS
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
            title={`Amount: $${Number(edgeData?.amount || 0).toLocaleString()} (${edgeData?.txCount || 1} tx)`}
          >
            ${Number(edgeData?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

TransactionEdge.displayName = 'TransactionEdge';
