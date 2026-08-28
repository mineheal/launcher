import { useEffect, useRef } from "react";
import { generateProceduralSkin } from "../lib/core";

/** Рисует фронтальный вид персонажа из скина 64×64. */
function drawSkin(ctx: CanvasRenderingContext2D, skin: HTMLCanvasElement | HTMLImageElement, scale: number) {
  const s = scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 16 * s, 34 * s);
  // ноги
  ctx.drawImage(skin, 4, 20, 4, 12, 4 * s, 20 * s, 4 * s, 12 * s);
  ctx.save();
  ctx.translate(12 * s, 20 * s); ctx.scale(-1, 1);
  ctx.drawImage(skin, 4, 20, 4, 12, 0, 0, 4 * s, 12 * s);
  ctx.restore();
  // руки
  ctx.drawImage(skin, 44, 20, 4, 12, 0, 8 * s, 4 * s, 12 * s);
  ctx.drawImage(skin, 44, 20, 4, 12, 12 * s, 8 * s, 4 * s, 12 * s);
  // торс
  ctx.drawImage(skin, 20, 20, 8, 12, 4 * s, 8 * s, 8 * s, 12 * s);
  // голова + шапка/волосы
  ctx.drawImage(skin, 8, 8, 8, 8, 4 * s, 0, 8 * s, 8 * s);
  ctx.drawImage(skin, 40, 8, 8, 8, 4 * s, 0, 8 * s, 8 * s);
}

interface Props {
  skinDataUrl?: string | null;
  nick: string;
  scale?: number;
  className?: string;
}

/**
 * Предпросмотр скина: если есть dataURL (ElyBy через Electron) — рисуем его,
 * иначе пробуем загрузить напрямую (web), иначе — процедурный скин по нику.
 */
export default function SkinPreview({ skinDataUrl, nick, scale = 9, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = 16 * scale;
    cv.height = 34 * scale;

    const drawProcedural = () => drawSkin(ctx, generateProceduralSkin(nick), scale);

    if (skinDataUrl) {
      const img = new Image();
      img.onload = () => drawSkin(ctx, img, scale);
      img.onerror = drawProcedural;
      img.src = skinDataUrl;
    } else {
      drawProcedural();
    }
  }, [skinDataUrl, nick, scale]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ imageRendering: "pixelated", width: 16 * scale, height: 34 * scale }}
    />
  );
}
