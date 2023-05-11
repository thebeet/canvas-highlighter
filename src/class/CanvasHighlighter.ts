import { IConfig, defaultConfig } from '../utils/config'
import { ICanvasHighlighter, IRange } from '../utils/types'
import { debounce } from '../utils/utils'
import Stage from './Stage'
import RangeFactory from './RangeFactory'

class CanvasHighlighter implements ICanvasHighlighter {
  private root: HTMLElement
  private config: IConfig

  private stage: Stage
  private rangeFactory: RangeFactory

  private ranges: IRange[] = []

  constructor(root: HTMLElement, config?: Partial<IConfig>) {
    this.root = root
    this.config = {
      ...defaultConfig,
      ...config
    }
    this.root.style.position = this.config.position
    this.stage = new Stage(this.root, this.config.pixelRatio)
    this.rangeFactory = new RangeFactory(this.root, this.config)

    this.observeResize()
  }

  getSelectionRange(selection?: Selection | null): IRange | null {
    selection = selection || document.getSelection()
    if (!selection) return null
    return this.rangeFactory.createRange(selection)
  }

  getSelectionPosition(selection?: Selection | null) {
    selection = selection || document.getSelection()
    if (!selection) return null
    return this.rangeFactory.getSelectionPosition(selection)
  }

  addRange(range: IRange): boolean {
    const rects = this.rangeFactory.createRects(range)

    if (rects.length === 0) return false

    this.ranges.push(range)

    const { id, config } = range
    this.stage.renderRange(rects, id, config)
    return true
  }

  getRange(id: string): IRange | null {
    const range = this.ranges.find(i => i.id === id)
    return range || null
  }

  deleteRange(id: string) {
    const index = this.ranges.findIndex(i => i.id === id)
    if (index === -1) return false
    this.ranges.splice(index, 1)
    this.stage.deleteRange(id)
    return true
  }

  updateRange(range: IRange) {
    this.deleteRange(range.id)
    this.addRange(range)
  }

  getRangeRect(range: IRange): { left: number, right: number, top: number, bottom: number } {
    const result = { left: 0, top: 0, right: 0, bottom: 0 }
    const rects = this.rangeFactory.createRects(range)

    if (rects.length === 0) return result
    result.top = rects[0].top
    result.left = rects[0].left
    result.right = rects[0].right
    result.bottom = rects[0].bottom
    rects.forEach(r => {
      result.top = Math.min(result.top, r.top)
      result.left = Math.min(result.left, r.left)
      result.right = Math.max(result.right, r.right)
      result.bottom = Math.max(result.bottom, r.bottom)
    })
    return result
  }

  getAllRange(): IRange[] {
    return [...this.ranges]
  }

  renderRanges(ranges: IRange[]) {
    this.clear()
    ranges.forEach(i => this.addRange(i))
  }

  clear(): void {
    this.ranges = []
    this.stage.clear()
  }

  private observeResize() {
    const observer = new ResizeObserver(debounce(this.handleResize.bind(this), this.config.delay))
    observer.observe(this.root)
  }

  private handleResize() {
    this.stage.updateStageSize()
    this.renderRanges(this.ranges)
  }

  getRangeIdByPointer(x: number, y: number) {
    return this.stage.getGroupIdByPointer(x, y)
  }

  getAllRangeIdByPointer(x: number, y: number) {
    return this.stage.getAllGroupIdByPointer(x, y)
  }
}

export default CanvasHighlighter
