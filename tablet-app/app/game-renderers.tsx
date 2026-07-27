"use client";

import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type GameType = "choice" | "dragSort" | "dragOrder" | "match" | "path" | "jigsaw";
export type GameItem = {
  id: string;
  label: string;
  emoji: string;
  target?: string;
};
export type GameActivity = {
  type?: GameType;
  prompt: string;
  voicePrompt?: string;
  instruction: string;
  visualOnly?: boolean;
  hint: string;
  explain: string;
  options?: GameItem[];
  answer?: number;
  items?: GameItem[];
  zones?: GameItem[];
  answerOrder?: string[];
  left?: GameItem[];
  right?: GameItem[];
  pairs?: [string, string][];
  size?: number;
  start?: number;
  goal?: number;
  blocked?: number[];
  solution?: number[];
  image?: string;
  rows?: number;
  columns?: number;
  order?: number[];
};

type RendererProps = {
  activity: GameActivity;
  selected: number | null;
  feedback: "correct" | "try" | null;
  disabled: boolean;
  onChoice: (index: number) => void;
  onComplete: () => void;
  onWrong: () => void;
  onProgress: () => void;
};

const visualClass = (emoji = "") => {
  const length = Array.from(emoji).length;
  return length > 8 ? "tiny" : length > 4 ? "compact" : "";
};

function ChoiceGame({ activity, selected, feedback, disabled, onChoice }: RendererProps) {
  return (
    <div className="options-grid">
      {(activity.options ?? []).map((option, index) => (
        <button
          key={option.id ?? option.label}
          disabled={disabled}
          onClick={() => onChoice(index)}
          aria-label={option.label}
          className={`option-card visual-option ${selected === index ? "selected" : ""} ${
            feedback === "correct" && index === activity.answer ? "correct" : ""
          } ${feedback === "try" && selected === index ? "wrong" : ""}`}
        >
          <span className={`option-visual ${visualClass(option.emoji)}`}>{option.emoji}</span>
          <strong className="sr-only">{option.label}</strong>
        </button>
      ))}
    </div>
  );
}

type DragState = { id: string; x: number; y: number } | null;

function DragSortGame({ activity, disabled, onComplete, onWrong, onProgress }: RendererProps) {
  const items = activity.items ?? [];
  const zones = activity.zones ?? [];
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);

  const place = (itemId: string, zoneId: string) => {
    if (disabled || placed[itemId]) return;
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || item.target !== zoneId) {
      onWrong();
      setPicked(null);
      return;
    }
    const next = { ...placed, [itemId]: zoneId };
    setPlaced(next);
    setPicked(null);
    onProgress();
    if (Object.keys(next).length === items.length) onComplete();
  };

  const finishDrag = (event: ReactPointerEvent) => {
    if (!drag) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop-zone]");
    if (target?.dataset.dropZone) place(drag.id, target.dataset.dropZone);
    setDrag(null);
  };

  return (
    <div className="sort-game">
      <div className="sort-items" aria-label="等待分类的图片">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={disabled || Boolean(placed[item.id])}
            className={`game-piece ${picked === item.id ? "picked" : ""} ${placed[item.id] ? "placed" : ""}`}
            onClick={() => setPicked(item.id)}
            onPointerDown={(event) => {
              if (disabled || placed[item.id]) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setPicked(item.id);
              setDrag({ id: item.id, x: event.clientX, y: event.clientY });
            }}
            onPointerMove={(event) => drag?.id === item.id && setDrag({ id: item.id, x: event.clientX, y: event.clientY })}
            onPointerUp={finishDrag}
            aria-label={`拿起${item.label}`}
          >
            <span className={`option-visual ${visualClass(item.emoji)}`}>{item.emoji}</span>
          </button>
        ))}
      </div>
      <div className="sort-zones">
        {zones.map((zone) => (
          <button
            key={zone.id}
            data-drop-zone={zone.id}
            className={`sort-zone ${picked ? "ready" : ""}`}
            onClick={() => picked && place(picked, zone.id)}
          >
            <span>{zone.emoji}</span>
            <strong>{zone.label}</strong>
            <div>
              {items.filter((item) => placed[item.id] === zone.id).map((item) => (
                <i key={item.id}>{item.emoji}</i>
              ))}
            </div>
          </button>
        ))}
      </div>
      {drag && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{items.find((item) => item.id === drag.id)?.emoji}</div>}
      <p className="touch-help">拖到篮子里，也可以先点图片再点篮子</p>
    </div>
  );
}

function DragOrderGame({ activity, disabled, onComplete, onWrong, onProgress }: RendererProps) {
  const items = activity.items ?? [];
  const answerOrder = activity.answerOrder ?? [];
  const [placed, setPlaced] = useState<(string | null)[]>(() => answerOrder.map(() => null));
  const [picked, setPicked] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);

  const put = (itemId: string, slot: number) => {
    if (disabled || placed.includes(itemId)) return;
    const item = items.find((candidate) => candidate.id === itemId);
    const expected = items.find((candidate) => candidate.id === answerOrder[slot]);
    if (!item || !expected || item.emoji !== expected.emoji || item.label !== expected.label) {
      onWrong();
      setPicked(null);
      return;
    }
    const next = [...placed];
    next[slot] = itemId;
    setPlaced(next);
    setPicked(null);
    onProgress();
    if (next.every(Boolean)) onComplete();
  };

  const finishDrag = (event: ReactPointerEvent) => {
    if (!drag) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-order-slot]");
    if (target?.dataset.orderSlot) put(drag.id, Number(target.dataset.orderSlot));
    setDrag(null);
  };

  return (
    <div className="order-game">
      <div className="pattern-model" aria-label="需要复制的规律">{activity.prompt}</div>
      <div className="order-slots">
        {answerOrder.map((_, slot) => {
          const item = items.find((candidate) => candidate.id === placed[slot]);
          return (
            <button
              key={slot}
              data-order-slot={slot}
              className={`order-slot ${picked ? "ready" : ""} ${item ? "filled" : ""}`}
              onClick={() => picked && put(picked, slot)}
              aria-label={`第${slot + 1}个位置`}
            >
              {item?.emoji ?? "?"}
            </button>
          );
        })}
      </div>
      <div className="order-tray">
        {items.map((item) => (
          <button
            key={item.id}
            disabled={disabled || placed.includes(item.id)}
            aria-label={`拿起${item.label}`}
            className={`game-piece ${picked === item.id ? "picked" : ""} ${placed.includes(item.id) ? "placed" : ""}`}
            onClick={() => setPicked(item.id)}
            onPointerDown={(event) => {
              if (disabled || placed.includes(item.id)) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setPicked(item.id);
              setDrag({ id: item.id, x: event.clientX, y: event.clientY });
            }}
            onPointerMove={(event) => drag?.id === item.id && setDrag({ id: item.id, x: event.clientX, y: event.clientY })}
            onPointerUp={finishDrag}
          >
            <span className={`option-visual ${visualClass(item.emoji)}`}>{item.emoji}</span>
          </button>
        ))}
      </div>
      {drag && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{items.find((item) => item.id === drag.id)?.emoji}</div>}
    </div>
  );
}

type MatchPoint = { x: number; y: number };

function MatchGame({ activity, disabled, onComplete, onWrong, onProgress }: RendererProps) {
  const left = activity.left ?? [];
  const right = activity.right ?? [];
  const pairs = activity.pairs ?? [];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [preview, setPreview] = useState<MatchPoint | null>(null);
  const [points, setPoints] = useState<Record<string, MatchPoint>>({});
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const measurePorts = () => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    const next: Record<string, MatchPoint> = {};
    container.querySelectorAll<HTMLElement>("[data-match-port]").forEach((port) => {
      const rect = port.getBoundingClientRect();
      next[port.dataset.matchPort ?? ""] = {
        x: rect.left + rect.width / 2 - bounds.left,
        y: rect.top + rect.height / 2 - bounds.top,
      };
    });
    setCanvasSize({ width: bounds.width, height: bounds.height });
    setPoints(next);
  };

  useLayoutEffect(() => {
    measurePorts();
    const observer = new ResizeObserver(measurePorts);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measurePorts);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measurePorts);
    };
  }, [activity]);

  const link = (leftId: string, rightId: string) => {
    if (disabled || connections.some(([source]) => source === leftId)) return;
    const valid = pairs.some(([source, target]) => source === leftId && target === rightId);
    if (!valid) {
      onWrong();
      setActive(null);
      return;
    }
    const next: [string, string][] = [...connections, [leftId, rightId]];
    setConnections(next);
    setActive(null);
    onProgress();
    if (next.length === pairs.length) onComplete();
  };

  const finish = (event: ReactPointerEvent, leftId: string) => {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-match-right]");
    if (target?.dataset.matchRight) link(leftId, target.dataset.matchRight);
    setPreview(null);
  };

  const movePreview = (event: ReactPointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPreview({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div className="real-match-game" ref={containerRef}>
      <div className="match-column">
        {left.map((item) => (
          <button
            key={item.id}
            aria-label={`左边${item.label}`}
            className={`match-node left ${active === item.id ? "active" : ""} ${connections.some(([source]) => source === item.id) ? "done" : ""}`}
            onClick={() => setActive(item.id)}
            onPointerDown={(event) => {
              if (disabled) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setActive(item.id);
              movePreview(event);
            }}
            onPointerMove={(event) => active === item.id && movePreview(event)}
            onPointerUp={(event) => finish(event, item.id)}
          >
            <span>{item.emoji}</span>
            <i className="match-port" data-match-port={`left-${item.id}`} />
          </button>
        ))}
      </div>
      <div className="match-column right">
        {right.map((item) => (
          <button
            key={item.id}
            data-match-right={item.id}
            aria-label={`右边${item.label}`}
            className={`match-node right ${connections.some(([, target]) => target === item.id) ? "done" : ""}`}
            onClick={() => active && link(active, item.id)}
          >
            <span>{item.emoji}</span>
            <i className="match-port" data-match-port={`right-${item.id}`} />
          </button>
        ))}
      </div>
      <svg
        className="match-lines-canvas"
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {connections.map(([source, target]) => {
          const from = points[`left-${source}`];
          const to = points[`right-${target}`];
          if (!from || !to) return null;
          return <line key={`${source}-${target}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
        })}
        {active && preview && (() => {
          const from = points[`left-${active}`];
          if (!from) return null;
          return <line className="preview" x1={from.x} y1={from.y} x2={preview.x} y2={preview.y} />;
        })()}
      </svg>
      <p className="touch-help">从左边拖线到右边，也可以先后点两个图片</p>
    </div>
  );
}

function PathGame({ activity, disabled, onComplete, onWrong, onProgress }: RendererProps) {
  const size = activity.size ?? 4;
  const start = activity.start ?? 0;
  const goal = activity.goal ?? size * size - 1;
  const blocked = activity.blocked ?? [];
  const [path, setPath] = useState<number[]>([start]);
  const pathRef = useRef<number[]>([start]);
  const drawingRef = useRef(false);
  const rejectedRef = useRef<number | null>(null);

  const visit = (cell: number) => {
    if (disabled) return;
    if (blocked.includes(cell)) {
      if (rejectedRef.current !== cell) onWrong();
      rejectedRef.current = cell;
      return;
    }
    rejectedRef.current = null;
    const currentPath = pathRef.current;
    const current = currentPath[currentPath.length - 1];
    if (cell === current) return;
    if (cell === currentPath[currentPath.length - 2]) {
      const next = currentPath.slice(0, -1);
      pathRef.current = next;
      setPath(next);
      return;
    }
    if (currentPath.includes(cell)) return;
    const row = Math.floor(current / size);
    const column = current % size;
    const nextRow = Math.floor(cell / size);
    const nextColumn = cell % size;
    if (Math.abs(row - nextRow) + Math.abs(column - nextColumn) !== 1) {
      onWrong();
      return;
    }
    const next = [...currentPath, cell];
    pathRef.current = next;
    setPath(next);
    onProgress();
    if (cell === goal) onComplete();
  };

  const cellFromPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const target = document.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-path-cell]");
    if (target?.dataset.pathCell) visit(Number(target.dataset.pathCell));
  };

  const reset = () => {
    pathRef.current = [start];
    setPath([start]);
    drawingRef.current = false;
    rejectedRef.current = null;
    onProgress();
  };

  const pathPoints = path.map((cell) => {
    const row = Math.floor(cell / size);
    const column = cell % size;
    return `${column + 0.5},${row + 0.5}`;
  }).join(" ");

  return (
    <div className="path-game">
      <div className="path-status"><span>🐭</span><i /><b>{path.length - 1} 步</b><i /><span>🧀</span></div>
      <div
        className="path-grid"
        style={{ "--path-size": size } as CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drawingRef.current = true;
          cellFromPointer(event);
        }}
        onPointerMove={(event) => drawingRef.current && cellFromPointer(event)}
        onPointerUp={(event) => {
          cellFromPointer(event);
          drawingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { drawingRef.current = false; }}
      >
        <svg className="path-trail" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={pathPoints} />
        </svg>
        {Array.from({ length: size * size }, (_, cell) => (
          <button
            key={cell}
            data-path-cell={cell}
            aria-label={cell === start ? "路径起点" : cell === goal ? "路径终点" : blocked.includes(cell) ? `障碍格${cell + 1}` : `路径格${cell + 1}`}
            className={`path-cell ${blocked.includes(cell) ? "blocked" : ""} ${path.includes(cell) ? "visited" : ""} ${cell === start ? "start" : ""} ${cell === goal ? "goal" : ""}`}
            onClick={() => visit(cell)}
          >
            {cell === start ? "🐭" : cell === goal ? "🧀" : blocked.includes(cell) ? "🪨" : path.includes(cell) ? <i>{path.indexOf(cell)}</i> : <span />}
          </button>
        ))}
      </div>
      <button className="path-reset" onClick={reset}>↻ 重新走</button>
      <p className="touch-help">从小老鼠开始，手指不要离开小路</p>
    </div>
  );
}

type HeadbreakerCanvas = {
  autogenerate: (options: { horizontalPiecesCount: number; verticalPiecesCount: number }) => void;
  adjustImagesToPuzzleWidth: () => void;
  attachSolvedValidator: () => void;
  onConnect: (listener: () => void) => void;
  onValid: (listener: () => void) => void;
  shuffleGrid: (farness?: number) => void;
  draw: () => void;
  __konvaLayer__?: { getStage: () => { destroy: () => void } };
};

function JigsawGame({ activity, disabled, onComplete, onProgress }: RendererProps) {
  const rows = activity.rows ?? 2;
  const columns = activity.columns ?? 2;
  const image = activity.image ?? "";
  const hostRef = useRef<HTMLDivElement | null>(null);
  const completeRef = useRef(onComplete);
  const progressRef = useRef(onProgress);
  const canvasId = `headbreaker-${useId().replace(/:/g, "")}`;
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    completeRef.current = onComplete;
    progressRef.current = onProgress;
  }, [onComplete, onProgress]);

  useEffect(() => {
    if (disabled || !hostRef.current) return;
    let disposed = false;
    let puzzleCanvas: HeadbreakerCanvas | null = null;
    const host = hostRef.current;
    const source = new Image();

    source.onload = async () => {
      const headbreaker = await import("headbreaker") as unknown as {
        Canvas: new (id: string, options: Record<string, unknown>) => HeadbreakerCanvas;
        painters: { Konva: new () => unknown };
      };
      if (disposed) return;
      const width = Math.max(320, Math.min(820, host.clientWidth || 820));
      const height = Math.round(Math.max(430, Math.min(560, width * 0.7)));
      const pieceWidth = Math.min(columns === 2 ? 148 : 116, width / (columns + 2.4));
      const pieceHeight = pieceWidth * 0.75;
      setCanvasHeight(height);

      puzzleCanvas = new headbreaker.Canvas(canvasId, {
        width,
        height,
        pieceSize: { x: pieceWidth, y: pieceHeight },
        proximity: Math.max(22, pieceWidth * 0.2),
        borderFill: { x: pieceWidth * 0.19, y: pieceHeight * 0.22 },
        strokeWidth: 3,
        strokeColor: "rgba(255,255,255,.96)",
        lineSoftness: 0.16,
        preventOffstageDrag: true,
        fixed: true,
        image: source,
        painter: new headbreaker.painters.Konva(),
      });
      puzzleCanvas.autogenerate({
        horizontalPiecesCount: columns,
        verticalPiecesCount: rows,
      });
      puzzleCanvas.adjustImagesToPuzzleWidth();
      puzzleCanvas.attachSolvedValidator();
      puzzleCanvas.onConnect(() => progressRef.current());
      puzzleCanvas.onValid(() => completeRef.current());
      puzzleCanvas.shuffleGrid(0.92);
      puzzleCanvas.draw();
      setLoading(false);
    };
    source.src = image;

    return () => {
      disposed = true;
      puzzleCanvas?.__konvaLayer__?.getStage().destroy();
      puzzleCanvas = null;
    };
  }, [canvasId, columns, disabled, image, rows]);

  return (
    <div className="jigsaw-game headbreaker-game" data-puzzle-engine="headbreaker">
      <header className="jigsaw-game-header">
        <div className="jigsaw-reference-thumb" role="img" aria-label="完整拼图参考" style={{ backgroundImage: `url("${image}")` }} />
        <div><strong>{rows * columns} 块</strong><span>拖动拼片，靠近正确伙伴会自动吸附</span></div>
        <i>开源引擎</i>
      </header>
      <div className="headbreaker-stage-shell" style={{ height: canvasHeight }}>
        {loading && <div className="jigsaw-loading">正在打乱拼图…</div>}
        <div id={canvasId} ref={hostRef} className="headbreaker-stage" />
      </div>
      <p className="touch-help">先找四个角，再把相邻的图案轻轻靠在一起</p>
    </div>
  );
}

export function GameRenderer(props: RendererProps) {
  const type = props.activity.type ?? "choice";
  if (type === "dragSort") return <DragSortGame {...props} />;
  if (type === "dragOrder") return <DragOrderGame {...props} />;
  if (type === "match") return <MatchGame {...props} />;
  if (type === "path") return <PathGame {...props} />;
  if (type === "jigsaw") return <JigsawGame {...props} />;
  return <ChoiceGame {...props} />;
}
