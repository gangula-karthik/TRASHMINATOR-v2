import * as tf from "@tensorflow/tfjs"

import LABELS from "../datasets/taco/classes.json"

export const preprocess = (
  source: HTMLVideoElement | HTMLImageElement,
  modelWidth: number,
  modelHeight: number
): [tf.Tensor, number, number] => {
  let xRatio: number = 1,
    yRatio: number = 1 // initialize ratios

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source)

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2) // get source width and height
    const maxSize = Math.max(w, h) // get max size
    const imgPadded: any = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ])

    xRatio = maxSize / w // update xRatio
    yRatio = maxSize / h // update yRatio

    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0) // add batch
  })

  return [input, xRatio, yRatio]
}

export const renderPrediction = (
  ctx: CanvasRenderingContext2D,
  boxesData: Float32Array,
  scoresData: Float32Array,
  classesData: Float32Array
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const font = "16px sans-serif"
  ctx.font = font
  ctx.textBaseline = "top"

  for (let i = 0; i < scoresData.length; ++i) {
    const klass = LABELS[classesData[i]]
    const score = (scoresData[i] * 100).toFixed(1)
    let [x1, y1, x2, y2] = Array.from(boxesData.slice(i * 4, (i + 1) * 4))
    x1 *= ctx.canvas.width
    x2 *= ctx.canvas.width
    y1 *= ctx.canvas.height
    y2 *= ctx.canvas.height
    const width = x2 - x1
    const height = y2 - y1

    ctx.strokeStyle = "#C53030"
    ctx.lineWidth = 2
    ctx.strokeRect(x1, y1, width, height)

    const label = `${klass} - ${score}%`
    const textWidth = ctx.measureText(label).width
    const textHeight = parseInt(font, 10) // base 10

    ctx.fillStyle = "#C53030"
    ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4)

    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(label, x1 + 2, y1 - (textHeight + 2))
  }
}
