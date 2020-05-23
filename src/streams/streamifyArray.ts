
import { ProcessStreamFunction } from "./Stream"
import * as api from "pareto-api"

/**
 * this function can be used as the argument to a stream: 'new Stream(streamifyArray(["x"]))'
 * @param array
 * @returns a function that processes the data from the stream
 */
export function streamifyArray<ElementType>(array: ElementType[]): ProcessStreamFunction<ElementType> {
    return (
        limiter: null | api.StreamLimiter,
        onData: (data: ElementType, abort: () => void) => void,
        onEnd: (aborted: boolean) => void
    ): void => {
        function pushData(theArray: ElementType[], limited: boolean) {
            let abort = false
            theArray.forEach(element => {
                if (!abort) {
                    onData(
                        element,
                        () => {
                            abort = true
                        }
                    )
                }
            })
            onEnd(limited || abort)
        }
        if (limiter !== null && limiter.maximum < array.length) {
            if (limiter.abortEarly) {
                onEnd(true)
            } else {
                pushData(array.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(array, false)
        }
    }
}
