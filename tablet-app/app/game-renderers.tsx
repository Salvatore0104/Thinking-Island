"use client";

import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
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
  const [drawing, setDrawing] = useState(false);

  const visit = (cell: number) => {
    if (disabled || blocked.includes(cell)) {
      if (blocked.includes(cell)) onWrong();
      return;
    }
    const current = path[path.length - 1];
    if (cell === path[path.length - 2]) {
      setPath(path.slice(0, -1));
      return;
    }
    if (path.includes(cell)) return;
    const row = Math.floor(current / size);
    const column = current % size;
    const nextRow = Math.floor(cell / size);
    const nextColumn = cell % size;
    if (Math.abs(row - nextRow) + Math.abs(column - nextColumn) !== 1) {
      onWrong();
      return;
    }
    const next = [...path, cell];
    setPath(next);
    onProgress();
    if (cell === goal) onComplete();
  };

  return (
    <div className="path-game">
      <div
        className="path-grid"
        style={{ "--path-size": size } as CSSProperties}
        onPointerLeave={() => setDrawing(false)}
        onPointerUp={() => setDrawing(false)}
      >
        {Array.from({ length: size * size }, (_, cell) => (
          <button
            key={cell}
            aria-label={cell === start ? "路径起点" : cell === goal ? "路径终点" : blocked.includes(cell) ? `障碍格${cell + 1}` : `路径格${cell + 1}`}
            className={`path-cell ${blocked.includes(cell) ? "blocked" : ""} ${path.includes(cell) ? "visited" : ""} ${cell === start ? "start" : ""} ${cell === goal ? "goal" : ""}`}
            onClick={() => visit(cell)}
            onPointerDown={() => { setDrawing(true); visit(cell); }}
            onPointerEnter={() => drawing && visit(cell)}
          >
            {cell === start ? "🐭" : cell === goal ? "🧀" : blocked.includes(cell) ? "🪨" : path.includes(cell) ? "•" : ""}
          </button>
        ))}
      </div>
      <button className="path-reset" onClick={() => setPath([start])}>↻ 重新走</button>
    </div>
  );
}

type PuzzleEdge = -1 | 0 | 1;

function puzzlePath(top: PuzzleEdge, right: PuzzleEdge, bottom: PuzzleEdge, left: PuzzleEdge) {
  const topY = top === 1 ? 1 : top === -1 ? 15 : 4;
  const rightX = right === 1 ? 99 : right === -1 ? 85 : 96;
  const bottomY = bottom === 1 ? 99 : bottom === -1 ? 85 : 96;
  const leftX = left === 1 ? 1 : left === -1 ? 15 : 4;
  return [
    "M 4 4",
    top === 0 ? "L 96 4" : `L 36 4 C 43 4 41 ${topY} 50 ${topY} C 59 ${topY} 57 4 64 4 L 96 4`,
    right === 0 ? "L 96 96" : `L 96 36 C 96 43 ${rightX} 41 ${rightX} 50 C ${rightX} 59 96 57 96 64 L 96 96`,
    bottom === 0 ? "L 4 96" : `L 64 96 C 57 96 59 ${bottomY} 50 ${bottomY} C 41 ${bottomY} 43 96 36 96 L 4 96`,
    left === 0 ? "L 4 4" : `L 4 64 C 4 57 ${leftX} 59 ${leftX} 50 C ${leftX} 41 4 43 4 36 L 4 4`,
    "Z",
  ].join(" ");
}

function JigsawPiece({ source, image, rows, columns }: { source: number; image: string; rows: number; columns: number }) {
  const row = Math.floor(source / columns);
  const column = source % columns;
  const parity = (row + column) % 2 === 0 ? 1 : -1;
  const edges: [PuzzleEdge, PuzzleEdge, PuzzleEdge, PuzzleEdge] = [
    row === 0 ? 0 : parity,
    column === columns - 1 ? 0 : parity,
    row === rows - 1 ? 0 : parity,
    column === 0 ? 0 : parity,
  ];
  const clipId = useId().replace(/:/g, "");
  const path = puzzlePath(...edges);
  return (
    <svg className="jigsaw-image" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><clipPath id={clipId}><path d={path} /></clipPath></defs>
      <image
        href={image}
        x={-column * 100}
        y={-row * 100}
        width={columns * 100}
        height={rows * 100}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
      />
      <path className="jigsaw-edge" d={path} />
    </svg>
  );
}

function JigsawGame({ activity, disabled, onComplete, onWrong, onProgress }: RendererProps) {
  const rows = activity.rows ?? 2;
  const columns = activity.columns ?? 4;
  const image = activity.image ?? "";
  const sources = activity.order ?? Array.from({ length: rows * columns }, (_, index) => index);
  const [placed, setPlaced] = useState<(number | null)[]>(() => sources.map(() => null));
  const [picked, setPicked] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ source: number; x: number; y: number } | null>(null);

  const place = (source: number, slot: number) => {
    if (disabled || placed.includes(source)) return;
    if (source !== slot) {
      onWrong();
      setPicked(null);
      return;
    }
    const next = [...placed];
    next[slot] = source;
    setPlaced(next);
    setPicked(null);
    onProgress();
    if (next.every((value) => value !== null)) onComplete();
  };

  const finishDrag = (event: ReactPointerEvent) => {
    if (!drag) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-jigsaw-slot]");
    if (target?.dataset.jigsawSlot) place(drag.source, Number(target.dataset.jigsawSlot));
    setDrag(null);
  };

  return (
    <div className="jigsaw-game">
      <div className="jigsaw-board-wrap">
        <div className="jigsaw-reference" style={{ backgroundImage: `url("${image}")` }} />
        <div className="jigsaw-board" style={{ "--jigsaw-columns": columns, "--jigsaw-rows": rows } as CSSProperties}>
          {placed.map((source, slot) => (
            <button
              key={slot}
              data-jigsaw-slot={slot}
              className={`jigsaw-slot ${source !== null ? "filled" : ""} ${picked !== null ? "ready" : ""}`}
              onClick={() => picked !== null && place(picked, slot)}
              aria-label={`拼图位置${slot + 1}`}
            >
              {source !== null && <JigsawPiece source={source} image={image} rows={rows} columns={columns} />}
            </button>
          ))}
        </div>
      </div>
      <div
        className="jigsaw-tray"
        style={{ "--jigsaw-tray-columns": columns } as CSSProperties}
      >
        {sources.map((source) => (
          <button
            key={source}
            disabled={disabled || placed.includes(source)}
            aria-label={`拿起拼图第${source + 1}块`}
            className={`jigsaw-piece ${picked === source ? "picked" : ""} ${placed.includes(source) ? "placed" : ""}`}
            onClick={() => setPicked(source)}
            onPointerDown={(event) => {
              if (disabled || placed.includes(source)) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              setPicked(source);
              setDrag({ source, x: event.clientX, y: event.clientY });
            }}
            onPointerMove={(event) => drag?.source === source && setDrag({ source, x: event.clientX, y: event.clientY })}
            onPointerUp={finishDrag}
          >
            <JigsawPiece source={source} image={image} rows={rows} columns={columns} />
          </button>
        ))}
      </div>
      {drag && (
        <div className="drag-ghost jigsaw" style={{ left: drag.x, top: drag.y }}>
          <JigsawPiece source={drag.source} image={image} rows={rows} columns={columns} />
        </div>
      )}
      <p className="touch-help">先找四个角，也可以先点拼图再点空位</p>
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
