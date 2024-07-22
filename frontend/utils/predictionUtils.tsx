import * as tf from "@tensorflow/tfjs";
import LABELS from "datasets/coco/classes.json";

export const renderPrediction = (ctx: CanvasRenderingContext2D, boxesData: Float32Array, scoresData: Float32Array, classesData: Float32Array) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    for (let i = 0; i < scoresData.length; ++i) {
        const klass = LABELS[classesData[i]];
        const score = (scoresData[i] * 100).toFixed(1);
        let [x1, y1, x2, y2] = Array.from(boxesData.slice(i * 4, (i + 1) * 4));
        x1 *= ctx.canvas.width;
        x2 *= ctx.canvas.width;
        y1 *= ctx.canvas.height;
        y2 *= ctx.canvas.height;
        const width = x2 - x1;
        const height = y2 - y1;

        ctx.strokeStyle = "#C53030";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        const label = `${klass} - ${score}%`;
        const textWidth = ctx.measureText(label).width;
        const textHeight = parseInt(font, 10); // base 10

        ctx.fillStyle = "#C53030";
        ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));
    }
};

export const doPredictFrame = async (model: tf.GraphModel, videoRef: React.RefObject<HTMLVideoElement>, renderPrediction: (ctx: CanvasRenderingContext2D, boxesData: Float32Array, scoresData: Float32Array, classesData: Float32Array) => void, canvasRef: React.RefObject<HTMLCanvasElement>, setAniId: React.Dispatch<React.SetStateAction<number | null>>) => {
    if (!model || !videoRef.current || !videoRef.current.srcObject) return;

    tf.engine().startScope();

    const [modelWidth, modelHeight] = model?.inputs[0]?.shape?.slice(1, 3) || [0, 0];

    const input = tf.tidy(() => {
        const frameTensor = tf.browser.fromPixels(videoRef.current!);
        return tf.image.resizeBilinear(frameTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    const res = await model.executeAsync(input) as tf.Tensor[];
    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
        renderPrediction(ctx, new Float32Array(boxesData), new Float32Array(scoresData), new Float32Array(classesData));
    }

    tf.dispose(res);

    const reqId = requestAnimationFrame(() => doPredictFrame(model, videoRef, renderPrediction, canvasRef, setAniId));
    setAniId(reqId);

    tf.engine().endScope();
};