import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  CircleDot,
  Network,
  Sparkles,
  Search,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Shield,
  Database,
  Cpu,
  Building2,
  User,
  Star,
  Activity,
  ArrowRight
} from "lucide-react";

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  targetX?: number;
  targetY?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface EntitySource {
  document_id: string;
  chunk_id: string;
  filename: string;
}

export interface EntityDetail {
  id: string;
  name: string;
  type: string;
  outgoing?: any[];
  incoming?: any[];
  sources?: EntitySource[];
}

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedId?: string | null;
  onSelectNode?: (id: string | null) => void;
  entityDetail?: EntityDetail | null;
}

export type LayoutMode = "radial" | "clusters" | "force";

// Type styling configuration
export const TYPE_CONFIG: Record<
  string,
  {
    fill: string;
    stroke: string;
    glow: string;
    text: string;
    bg: string;
    icon: string;
    domain: string;
    LucideIcon: typeof Star;
  }
> = {
  PRODUCT: {
    fill: "#2563eb",
    stroke: "#1d4ed8",
    glow: "rgba(37, 99, 235, 0.45)",
    text: "#1d4ed8",
    bg: "#eff6ff",
    icon: "★",
    domain: "Core Platform",
    LucideIcon: Star,
  },
  SYSTEM: {
    fill: "#0284c7",
    stroke: "#0369a1",
    glow: "rgba(2, 132, 199, 0.4)",
    text: "#0369a1",
    bg: "#f0f9ff",
    icon: "⚙",
    domain: "Core Platform",
    LucideIcon: Cpu,
  },
  TECHNOLOGY: {
    fill: "#7c3aed",
    stroke: "#6d28d9",
    glow: "rgba(124, 58, 237, 0.4)",
    text: "#6d28d9",
    bg: "#f5f3ff",
    icon: "◆",
    domain: "Data & Storage",
    LucideIcon: Database,
  },
  POLICY: {
    fill: "#059669",
    stroke: "#047857",
    glow: "rgba(5, 150, 105, 0.4)",
    text: "#047857",
    bg: "#ecfdf5",
    icon: "🛡",
    domain: "Security & Governance",
    LucideIcon: Shield,
  },
  DEPARTMENT: {
    fill: "#d97706",
    stroke: "#b45309",
    glow: "rgba(217, 119, 6, 0.4)",
    text: "#b45309",
    bg: "#fffbeb",
    icon: "🏛",
    domain: "Operations & Org",
    LucideIcon: Building2,
  },
  PERSON: {
    fill: "#e11d48",
    stroke: "#be123c",
    glow: "rgba(225, 29, 72, 0.4)",
    text: "#be123c",
    bg: "#fff1f2",
    icon: "●",
    domain: "Operations & Org",
    LucideIcon: User,
  },
  CONCEPT: {
    fill: "#0891b2",
    stroke: "#0e7490",
    glow: "rgba(8, 145, 178, 0.4)",
    text: "#0e7490",
    bg: "#ecfeff",
    icon: "◈",
    domain: "Core Platform",
    LucideIcon: Activity,
  },
  ORGANIZATION: {
    fill: "#4f46e5",
    stroke: "#4338ca",
    glow: "rgba(79, 70, 229, 0.4)",
    text: "#4338ca",
    bg: "#eef2ff",
    icon: "🏢",
    domain: "Operations & Org",
    LucideIcon: Building2,
  },
  DEFAULT: {
    fill: "#475569",
    stroke: "#334155",
    glow: "rgba(71, 85, 105, 0.3)",
    text: "#334155",
    bg: "#f8fafc",
    icon: "•",
    domain: "Other",
    LucideIcon: Activity,
  },
};

export function KnowledgeGraphCanvas({
  nodes,
  links,
  selectedId,
  onSelectNode,
  entityDetail,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("radial");
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const animTimeRef = useRef(0);

  // Compute node degrees (connectivity count)
  const nodeDegrees = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      counts[l.source] = (counts[l.source] || 0) + 1;
      counts[l.target] = (counts[l.target] || 0) + 1;
    });
    return counts;
  }, [links]);

  // Compute Layout Positions
  useEffect(() => {
    if (!nodes.length) {
      setSimNodes([]);
      return;
    }

    const width = containerRef.current?.clientWidth || 980;
    const height = 640;
    const cx = width / 2;
    const cy = height / 2;

    // Find central root node (highest degree, preferably PRODUCT)
    let rootNode = nodes.find((n) => n.type.toUpperCase() === "PRODUCT");
    if (!rootNode) {
      rootNode = [...nodes].sort((a, b) => (nodeDegrees[b.id] || 0) - (nodeDegrees[a.id] || 0))[0];
    }
    const rootId = rootNode?.id;

    if (layoutMode === "radial") {
      // -------------------------------------------------------------
      // 1. CONCENTRIC ORBIT LAYOUT (Clean, Symmetric, Zero Clutter)
      // -------------------------------------------------------------
      const orbit1: GraphNode[] = []; // Direct Core Engines & Tech
      const orbit2: GraphNode[] = []; // Policies, Components, Sub-systems
      const orbit3: GraphNode[] = []; // Depts, People, Perimeter

      nodes.forEach((n) => {
        if (n.id === rootId) return;
        const t = n.type.toUpperCase();
        if (t === "SYSTEM" || (t === "TECHNOLOGY" && (nodeDegrees[n.id] || 0) >= 3)) {
          orbit1.push(n);
        } else if (t === "POLICY" || t === "TECHNOLOGY" || t === "CONCEPT") {
          orbit2.push(n);
        } else {
          orbit3.push(n);
        }
      });

      const updated = nodes.map((node) => {
        if (node.id === rootId) {
          return { ...node, x: cx, y: cy, targetX: cx, targetY: cy, vx: 0, vy: 0 };
        }

        let radius = 180;
        let index = orbit1.findIndex((item) => item.id === node.id);
        let total = orbit1.length;

        if (index === -1) {
          index = orbit2.findIndex((item) => item.id === node.id);
          total = orbit2.length;
          radius = 300;
        }
        if (index === -1) {
          index = orbit3.findIndex((item) => item.id === node.id);
          total = orbit3.length;
          radius = 420;
        }

        const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 2;
        const tx = cx + Math.cos(angle) * radius;
        const ty = cy + Math.sin(angle) * radius;

        return {
          ...node,
          x: node.x ? node.x : tx,
          y: node.y ? node.y : ty,
          targetX: tx,
          targetY: ty,
          vx: 0,
          vy: 0,
        };
      });

      setSimNodes(updated);
    } else if (layoutMode === "clusters") {
      // -------------------------------------------------------------
      // 2. DOMAIN POD LAYOUT (Grouped in 4 Functional Quadrants)
      // -------------------------------------------------------------
      const pods: Record<string, GraphNode[]> = {
        "Core Platform": [],
        "Data & Storage": [],
        "Security & Governance": [],
        "Operations & Org": [],
      };

      nodes.forEach((n) => {
        const conf = TYPE_CONFIG[n.type.toUpperCase()] || TYPE_CONFIG.DEFAULT;
        const d = pods[conf.domain] ? conf.domain : "Core Platform";
        pods[d].push(n);
      });

      const podCenters: Record<string, { x: number; y: number }> = {
        "Core Platform": { x: cx - 260, y: cy - 140 },
        "Data & Storage": { x: cx - 260, y: cy + 150 },
        "Security & Governance": { x: cx + 260, y: cy - 140 },
        "Operations & Org": { x: cx + 260, y: cy + 150 },
      };

      const updated = nodes.map((node) => {
        const conf = TYPE_CONFIG[node.type.toUpperCase()] || TYPE_CONFIG.DEFAULT;
        const d = pods[conf.domain] ? conf.domain : "Core Platform";
        const group = pods[d];
        const center = podCenters[d] || { x: cx, y: cy };
        const idx = group.findIndex((item) => item.id === node.id);
        const total = group.length;

        // Circular ring inside each domain pod
        const subRadius = Math.min(130, Math.max(50, total * 16));
        const angle = (idx / Math.max(1, total)) * 2 * Math.PI;
        const tx = center.x + Math.cos(angle) * subRadius;
        const ty = center.y + Math.sin(angle) * subRadius;

        return {
          ...node,
          x: node.x ? node.x : tx,
          y: node.y ? node.y : ty,
          targetX: tx,
          targetY: ty,
          vx: 0,
          vy: 0,
        };
      });

      setSimNodes(updated);
    } else {
      // -------------------------------------------------------------
      // 3. ORGANIC SPRING (Anti-collision Damped Force Layout)
      // -------------------------------------------------------------
      const updated = nodes.map((node, i) => {
        if (node.x && node.y) return { ...node, targetX: undefined, targetY: undefined };
        const angle = (i / nodes.length) * 2 * Math.PI;
        const r = 180 + (i % 3) * 90;
        return {
          ...node,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          targetX: undefined,
          targetY: undefined,
          vx: 0,
          vy: 0,
        };
      });
      setSimNodes(updated);
    }
  }, [nodes, layoutMode, nodeDegrees]);

  // Physics & Animation Loop
  useEffect(() => {
    if (!simNodes.length) return;
    let animId: number;

    const nodeMap = new Map<string, GraphNode>();
    simNodes.forEach((n) => nodeMap.set(n.id, n));

    const step = () => {
      animTimeRef.current += 0.02;

      if (layoutMode === "radial" || layoutMode === "clusters") {
        // Smoothly interpolate towards clean target positions (spring interpolation)
        simNodes.forEach((n) => {
          if (draggedNodeRef.current?.id === n.id) return;
          if (n.targetX !== undefined && n.targetY !== undefined && n.x !== undefined && n.y !== undefined) {
            n.x += (n.targetX - n.x) * 0.14;
            n.y += (n.targetY - n.y) * 0.14;
          }
        });
      } else {
        // Anti-collision force layout
        for (let i = 0; i < simNodes.length; i++) {
          for (let j = i + 1; j < simNodes.length; j++) {
            const a = simNodes[i];
            const b = simNodes[j];
            if (a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 125; // Strict anti-overlap buffer

            if (dist < minDist) {
              const force = ((minDist - dist) / dist) * 0.28;
              const fx = dx * force;
              const fy = dy * force;
              if (draggedNodeRef.current?.id !== a.id) {
                a.vx = (a.vx || 0) - fx;
                a.vy = (a.vy || 0) - fy;
              }
              if (draggedNodeRef.current?.id !== b.id) {
                b.vx = (b.vx || 0) + fx;
                b.vy = (b.vy || 0) + fy;
              }
            } else {
              // Standard spring repulsion
              const rep = 2200 / (dist * dist);
              const fx = (dx / dist) * rep;
              const fy = (dy / dist) * rep;
              if (draggedNodeRef.current?.id !== a.id) {
                a.vx = (a.vx || 0) - fx;
                a.vy = (a.vy || 0) - fy;
              }
              if (draggedNodeRef.current?.id !== b.id) {
                b.vx = (b.vx || 0) + fx;
                b.vy = (b.vy || 0) + fy;
              }
            }
          }
        }

        // Link tension pull
        links.forEach((l) => {
          const s = nodeMap.get(l.source);
          const t = nodeMap.get(l.target);
          if (!s || !t || s.x === undefined || s.y === undefined || t.x === undefined || t.y === undefined) return;

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 170;
          const force = (dist - targetDist) * 0.0035;

          if (draggedNodeRef.current?.id !== s.id) {
            s.vx = (s.vx || 0) + (dx / dist) * force;
            s.vy = (s.vy || 0) + (dy / dist) * force;
          }
          if (draggedNodeRef.current?.id !== t.id) {
            t.vx = (t.vx || 0) - (dx / dist) * force;
            t.vy = (t.vy || 0) - (dy / dist) * force;
          }
        });

        // Center gravity pull
        const width = containerRef.current?.clientWidth || 980;
        const height = 640;
        const cx = width / 2;
        const cy = height / 2;

        simNodes.forEach((n) => {
          if (draggedNodeRef.current?.id === n.id) return;
          if (n.x === undefined || n.y === undefined) return;

          const cdx = cx - n.x;
          const cdy = cy - n.y;
          n.vx = (n.vx || 0) + cdx * 0.0006;
          n.vy = (n.vy || 0) + cdy * 0.0006;

          // Apply friction damping
          n.vx = (n.vx || 0) * 0.82;
          n.vy = (n.vy || 0) * 0.82;

          n.x += n.vx;
          n.y += n.vy;
        });
      }

      drawCanvas();
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [simNodes, layoutMode, links, scale, pan, hoveredNode, selectedId, typeFilter, showAllLabels]);

  // Main Canvas Rendering Routine
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    const cx = width / (2 * dpr);
    const cy = height / (2 * dpr);

    // -------------------------------------------------------------
    // Background Overlays & Structural Layout Guides
    // -------------------------------------------------------------
    if (layoutMode === "radial") {
      // Concentric Orbital Rings
      const orbits = [
        { r: 180, label: "Core Engines & Retrieval Services" },
        { r: 300, label: "Datastores, Frameworks & Governance" },
        { r: 420, label: "Global Hubs & Enterprise Personnel" },
      ];

      orbits.forEach((orbit) => {
        ctx.beginPath();
        ctx.arc(cx, cy, orbit.r, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label badge
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(orbit.label.toUpperCase(), cx, cy - orbit.r - 8);
      });

      // Core anchor glow at center
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      coreGrad.addColorStop(0, "rgba(37, 99, 235, 0.12)");
      coreGrad.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, 2 * Math.PI);
      ctx.fill();
    } else if (layoutMode === "clusters") {
      // 4 Quadrant Domain Pod Cards
      const pods = [
        {
          name: "CORE PLATFORM",
          desc: "Orchestration & Retrieval Fusion",
          color: "rgba(37, 99, 235, 0.04)",
          border: "rgba(37, 99, 235, 0.2)",
          x: cx - 440,
          y: cy - 250,
          w: 380,
          h: 220,
        },
        {
          name: "DATA & STORAGE",
          desc: "Vector, Cache & Relational Stores",
          color: "rgba(124, 58, 237, 0.04)",
          border: "rgba(124, 58, 237, 0.2)",
          x: cx - 440,
          y: cy + 40,
          w: 380,
          h: 220,
        },
        {
          name: "SECURITY & GOVERNANCE",
          desc: "Zero-Trust, SOC2 & Redaction",
          color: "rgba(5, 150, 105, 0.04)",
          border: "rgba(5, 150, 105, 0.2)",
          x: cx + 60,
          y: cy - 250,
          w: 380,
          h: 220,
        },
        {
          name: "OPERATIONS & ORG",
          desc: "Divisions, Regional Hubs & Teams",
          color: "rgba(217, 119, 6, 0.04)",
          border: "rgba(217, 119, 6, 0.2)",
          x: cx + 60,
          y: cy + 40,
          w: 380,
          h: 220,
        },
      ];

      pods.forEach((pod) => {
        // Rounded box
        const r = 16;
        ctx.beginPath();
        ctx.roundRect(pod.x, pod.y, pod.w, pod.h, r);
        ctx.fillStyle = pod.color;
        ctx.fill();
        ctx.strokeStyle = pod.border;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pod header
        ctx.fillStyle = "#334155";
        ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(pod.name, pod.x + 16, pod.y + 24);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(pod.desc, pod.x + 16, pod.y + 38);
      });
    }

    const nodeMap = new Map<string, GraphNode>();
    simNodes.forEach((n) => nodeMap.set(n.id, n));

    const activeNodeId = selectedId || hoveredNode?.id || null;

    // -------------------------------------------------------------
    // Draw Links & Relationship Particles
    // -------------------------------------------------------------
    links.forEach((l) => {
      const s = nodeMap.get(l.source);
      const t = nodeMap.get(l.target);
      if (!s || !t || s.x === undefined || s.y === undefined || t.x === undefined || t.y === undefined) return;

      const isConnected = activeNodeId && (l.source === activeNodeId || l.target === activeNodeId);
      const isFilteredOut =
        typeFilter &&
        s.type.toUpperCase() !== typeFilter &&
        t.type.toUpperCase() !== typeFilter;

      // Slight quadratic curve to prevent overlap
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Offset curve perpendicular to line
      const offset = Math.min(24, dist * 0.08);
      const nx = -dy / dist;
      const ny = dx / dist;
      const cx_ctrl = mx + nx * offset;
      const cy_ctrl = my + ny * offset;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(cx_ctrl, cy_ctrl, t.x, t.y);

      if (isConnected) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(37, 99, 235, 0.4)";
        ctx.shadowBlur = 6;
      } else if (isFilteredOut) {
        ctx.strokeStyle = "rgba(226, 232, 240, 0.4)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = "rgba(203, 213, 225, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Energy Flow Particle on Active/Connected Links
      if (isConnected) {
        const tProgress = (animTimeRef.current * 0.8) % 1;
        // Point on quadratic bezier
        const qx = (1 - tProgress) * (1 - tProgress) * s.x + 2 * (1 - tProgress) * tProgress * cx_ctrl + tProgress * tProgress * t.x;
        const qy = (1 - tProgress) * (1 - tProgress) * s.y + 2 * (1 - tProgress) * tProgress * cy_ctrl + tProgress * tProgress * t.y;

        ctx.beginPath();
        ctx.arc(qx, qy, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = "#3b82f6";
        ctx.shadowColor = "#60a5fa";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Relation Pill Badge (When focused or when showAllLabels is toggled)
      if (isConnected || showAllLabels) {
        const labelText = l.relation.replace(/_/g, " ");
        ctx.font = "bold 9px system-ui, -apple-system, sans-serif";
        const textWidth = ctx.measureText(labelText).width;
        const px = cx_ctrl;
        const py = cy_ctrl;

        // Pill background
        const padX = 6;
        const padY = 3;
        ctx.beginPath();
        ctx.roundRect(px - textWidth / 2 - padX, py - 6 - padY, textWidth + padX * 2, 13 + padY * 2, 6);
        ctx.fillStyle = isConnected ? "#1e293b" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = isConnected ? "#3b82f6" : "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label text
        ctx.fillStyle = isConnected ? "#ffffff" : "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, px, py + 1);
      }
    });

    // -------------------------------------------------------------
    // Draw Nodes
    // -------------------------------------------------------------
    simNodes.forEach((n) => {
      if (n.x === undefined || n.y === undefined) return;

      const conf = TYPE_CONFIG[n.type.toUpperCase()] || TYPE_CONFIG.DEFAULT;
      const isSelected = selectedId === n.id;
      const isHovered = hoveredNode?.id === n.id;
      const isCentral = n.type.toUpperCase() === "PRODUCT";
      const isFiltered = typeFilter && n.type.toUpperCase() !== typeFilter;

      // Node Size
      let baseRadius = 18;
      if (isCentral) baseRadius = 24;
      else if ((nodeDegrees[n.id] || 0) >= 3) baseRadius = 20;

      const r = isSelected || isHovered ? baseRadius + 3 : baseRadius;

      // Glow effect for Selected / Hovered / Central
      if (isSelected || isHovered || isCentral) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8, 0, 2 * Math.PI);
        ctx.fillStyle = conf.glow;
        ctx.fill();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isFiltered ? "#cbd5e1" : conf.fill;
      ctx.fill();

      // Node Border
      ctx.strokeStyle = isSelected ? "#ffffff" : isFiltered ? "#94a3b8" : conf.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Icon symbol inside node
      ctx.fillStyle = isFiltered ? "#64748b" : "#ffffff";
      ctx.font = `bold ${r >= 22 ? 14 : 11}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(conf.icon, n.x, n.y + 1);

      // Node Text Label Pill Below Circle
      const labelY = n.y + r + 14;
      ctx.font = `600 ${isCentral ? 12 : 11}px system-ui, -apple-system, sans-serif`;
      const nameWidth = ctx.measureText(n.name).width;

      // Label background card for readability
      const padX = 7;
      const padY = 3.5;
      ctx.beginPath();
      ctx.roundRect(
        n.x - nameWidth / 2 - padX,
        labelY - 7 - padY,
        nameWidth + padX * 2,
        15 + padY * 2,
        6
      );
      ctx.fillStyle = isSelected
        ? "#0f172a"
        : isHovered
        ? "#ffffff"
        : "rgba(255, 255, 255, 0.94)";
      ctx.fill();
      ctx.strokeStyle = isSelected
        ? "#2563eb"
        : isHovered
        ? conf.stroke
        : "rgba(226, 232, 240, 0.9)";
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.stroke();

      // Label text
      ctx.fillStyle = isSelected ? "#ffffff" : isFiltered ? "#94a3b8" : "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.name, n.x, labelY);
    });

    ctx.restore();
  }, [
    simNodes,
    links,
    scale,
    pan,
    hoveredNode,
    selectedId,
    typeFilter,
    showAllLabels,
    layoutMode,
    nodeDegrees,
  ]);

  // Sync canvas size with high DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth || 980;
    const height = 640;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    drawCanvas();
  }, [drawCanvas]);

  // Mouse Interactivity Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left);
    const mouseY = (e.clientY - rect.top);

    // Invert pan and scale
    return {
      x: (mouseX - pan.x) / scale,
      y: (mouseY - pan.y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Check if clicked a node
    const clickedNode = simNodes.find((n) => {
      if (n.x === undefined || n.y === undefined) return false;
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 24;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      onSelectNode?.(clickedNode.id);
      setIsInspectorOpen(true);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const { x, y } = getCanvasCoords(e);
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.targetX = x;
      draggedNodeRef.current.targetY = y;
      return;
    }

    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const hitNode = simNodes.find((n) => {
      if (n.x === undefined || n.y === undefined) return false;
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 24;
    });

    setHoveredNode(hitNode || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const handleFitView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSearchSelect = (nodeId: string) => {
    const target = simNodes.find((n) => n.id === nodeId);
    if (!target || target.x === undefined || target.y === undefined) return;

    const width = containerRef.current?.clientWidth || 980;
    const height = 640;

    // Pan camera to center on target node
    setPan({
      x: width / 2 - target.x * scale,
      y: height / 2 - target.y * scale,
    });
    onSelectNode?.(nodeId);
    setIsInspectorOpen(true);
    setSearchQuery("");
  };

  // Connected links for selected node
  const activeNodeId = selectedId || hoveredNode?.id || null;
  const selectedNode = simNodes.find((n) => n.id === activeNodeId) || null;

  const connectedLinks = useMemo(() => {
    if (!activeNodeId) return [];
    return links.filter((l) => l.source === activeNodeId || l.target === activeNodeId);
  }, [links, activeNodeId]);

  // Unique categories count
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => {
      const t = n.type.toUpperCase();
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs select-none transition-all ${
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : "h-[760px]"
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP DEDICATED STUDIO CONTROL BAR (No Canvas Overlap!)           */}
      {/* ------------------------------------------------------------- */}
      <header className="flex flex-col border-b border-slate-200 bg-slate-50/90 backdrop-blur-md px-4 py-3 gap-3">
        {/* Row 1: Layout Mode Switcher & Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Layout Mode Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1">
            <button
              onClick={() => setLayoutMode("radial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === "radial"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Symmetric concentric orbits radiating from KnowledgeMesh core"
            >
              <CircleDot className="h-3.5 w-3.5" />
              <span>Concentric Orbits</span>
            </button>

            <button
              onClick={() => setLayoutMode("clusters")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === "clusters"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grouped into 4 clean functional domain quadrants"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Domain Pods</span>
            </button>

            <button
              onClick={() => setLayoutMode("force")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === "force"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Physics-based elastic repulsion with strict anti-collision buffer"
            >
              <Network className="h-3.5 w-3.5" />
              <span>Organic Spring</span>
            </button>
          </div>

          {/* Quick Search & Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find entity..."
                className="h-8 w-44 rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-blue-600 focus:w-60 transition-all shadow-2xs"
              />
              {searchQuery && (
                <div className="absolute top-10 right-0 w-64 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 space-y-1 z-30 max-h-56 overflow-y-auto">
                  {nodes
                    .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleSearchSelect(n.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-blue-50 transition-colors"
                      >
                        <span className="font-semibold text-slate-900 truncate">{n.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{n.type}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAllLabels((v) => !v)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all ${
                showAllLabels
                  ? "border-blue-400 text-blue-700 bg-blue-50/80 shadow-2xs"
                  : "border-slate-300 text-slate-600 hover:text-slate-900 bg-white shadow-2xs"
              }`}
              title="Toggle relationship label pills"
            >
              <span>{showAllLabels ? "Labels: All" : "Labels: Focus"}</span>
            </button>

            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-slate-900 shadow-2xs"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Filter Type:</span>
          <button
            onClick={() => setTypeFilter(null)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              typeFilter === null
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span>All ({nodes.length})</span>
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const conf = TYPE_CONFIG[type] || TYPE_CONFIG.DEFAULT;
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive ? null : type)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conf.fill }} />
                <span>{type}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* GRAPH CANVAS DRAWING AREA                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[calc(100%-105px)] bg-radial from-slate-50 via-white to-slate-100/40">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Bottom Right Floating Zoom & Fit HUD */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md pointer-events-auto">
          <button
            onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.4, s * 0.8))}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Center / Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom Left Legend Status Bar */}
        <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs text-[11px] font-medium text-slate-600 pointer-events-none">
          <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>Click any node to open inspector</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>{nodes.length} entities &bull; {links.length} directed links</span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE FLOATING INSPECTOR DRAWER                         */}
        {/* ------------------------------------------------------------- */}
        {selectedNode && isInspectorOpen && (
          <aside className="absolute top-4 right-4 w-88 max-h-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md overflow-y-auto space-y-4 animate-in slide-in-from-right-4 duration-200 z-20">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: (TYPE_CONFIG[selectedNode.type.toUpperCase()] || TYPE_CONFIG.DEFAULT).bg,
                      color: (TYPE_CONFIG[selectedNode.type.toUpperCase()] || TYPE_CONFIG.DEFAULT).text,
                    }}
                  >
                    {selectedNode.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {connectedLinks.length} connections
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedNode.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Domain: {(TYPE_CONFIG[selectedNode.type.toUpperCase()] || TYPE_CONFIG.DEFAULT).domain}
                </p>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Inbound Deps</div>
                <div className="text-base font-extrabold text-slate-800">
                  {connectedLinks.filter((l) => l.target === selectedNode.id).length}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Outbound Links</div>
                <div className="text-base font-extrabold text-slate-800">
                  {connectedLinks.filter((l) => l.source === selectedNode.id).length}
                </div>
              </div>
            </div>

            {/* Connected Neighbors List */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Connected Relationships ({connectedLinks.length})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {connectedLinks.map((link, idx) => {
                  const isOut = link.source === selectedNode.id;
                  const otherId = isOut ? link.target : link.source;
                  const otherNode = simNodes.find((n) => n.id === otherId);
                  if (!otherNode) return null;
                  const otherConf = TYPE_CONFIG[otherNode.type.toUpperCase()] || TYPE_CONFIG.DEFAULT;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSearchSelect(otherId)}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-200 text-left transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: otherConf.fill }}
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                            {otherNode.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            {isOut ? (
                              <>
                                <ArrowRight className="h-2.5 w-2.5 text-blue-500" />
                                <span>{link.relation}</span>
                              </>
                            ) : (
                              <>
                                <span>{link.relation}</span>
                                <ArrowRight className="h-2.5 w-2.5 text-slate-400 rotate-180" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Document Chunks (if entityDetail provided) */}
            {entityDetail && entityDetail.sources && entityDetail.sources.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>Source Documents ({entityDetail.sources.length})</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {entityDetail.sources.map((src) => (
                    <div
                      key={`${src.document_id}-${src.chunk_id}`}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-700 truncate mr-2">
                        {src.filename}
                      </span>
                      <a
                        href={`/api/documents/${src.document_id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-bold text-[11px] flex-shrink-0"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
