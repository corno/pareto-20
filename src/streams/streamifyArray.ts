
import { ProcessStreamFunction } from "./Stream"
import * as api from "pareto-api"
import { handleDataOrPromise } from "../promises/SafePromise"
import { DataOrPromise } from "pareto-api"

/**
 * this function can be used as the argument to a stream: 'new Stream(streamifyArray(["x"]))'
 * @param array
 * @returns a function that processes the data from the stream
 */
export function streamifyArray<ElementType>(
    array: ElementType[],
): ProcessStreamFunction<ElementType, boolean, null> {
    return (
        limiter: null | api.StreamLimiter,
        onData: (data: ElementType) => DataOrPromise<boolean>,
        onEnd: (aborted: boolean, endData: null) => void
    ): void => {
        function pushData(theArray: ElementType[], limited: boolean) {
            let abort = false
            theArray.forEach(element => {
                if (!abort) {
                    const onDataResult = onData(element)
                    handleDataOrPromise(onDataResult, abortRequested => {
                        if (abortRequested) {
                            abort = true
                        }
                    })
                }
            })
            onEnd(limited || abort, null)
        }
        if (limiter !== null && limiter.maximum < array.length) {
            if (limiter.abortEarly) {
                onEnd(true, null)
            } else {
                pushData(array.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(array, false)
        }
    }
}
