
import { ProcessStreamFunction } from "./Stream"
import * as api from "pareto-api"

/**
 * this function can be used as the argument to a stream: 'new Stream(streamifyArray(["x"]))'
 * @param array
 * @returns a function that processes the data from the stream
 */
export function streamifyArray<ElementType, EndDataType>(
    array: ElementType[],
    endData: EndDataType,
    ): ProcessStreamFunction<ElementType, EndDataType> {
    return (
        limiter: null | api.StreamLimiter,
        onData: (data: ElementType) => api.ISafePromise<boolean> | boolean,
        onEnd: (aborted: boolean, endData: EndDataType) => void
    ): void => {
        function pushData(theArray: ElementType[], limited: boolean) {
            let abort = false
            theArray.forEach(element => {
                if (!abort) {
                    const onDataResult = onData(element)
                    if (typeof onDataResult === "boolean") {
                        if (onDataResult === true) {
                            abort = true
                        }
                    } else {
                        onDataResult.handleSafePromise(abortRequested => {
                            if (abortRequested) {
                                abort = true
                            }
                        })
                    }
                }
            })
            onEnd(limited || abort, endData)
        }
        if (limiter !== null && limiter.maximum < array.length) {
            if (limiter.abortEarly) {
                onEnd(true, endData)
            } else {
                pushData(array.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(array, false)
        }
    }
}
