
import { ProcessStreamFunction } from "./Stream"
import * as api from "pareto-api"
import { result, handleDataOrPromise } from "../promises/SafePromise"
import { DataOrPromise } from "pareto-api"
import { wrap } from "../wrap"

type State = {
    index: number
    mustAbort: boolean
}

function loopUntilEndOrPromise<ElementType>(
    array: ElementType[],
    state: State,
    onData: (data: ElementType) => DataOrPromise<boolean>,
): DataOrPromise<boolean> {
    while (true) {
        if (state.mustAbort) {
            return result(true)
        }
        if (state.index === array.length) {
            return result(false) //end reached
        }
        const x = onData(array[state.index])
        state.index += 1
        if (x instanceof Array) {
            if (x[0]) {
                state.mustAbort = true
                return result(true) //abort
            }
        } else {
            return wrap.SafePromise(x).mapResult(mustAbort => {
                if (mustAbort) {
                    state.mustAbort = true
                    return result(true)
                }
                return loopUntilEndOrPromise(
                    array,
                    state,
                    onData,
                )
            })
        }
    }
}

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
            const state: State = {
                index: 0,
                mustAbort: false,
            }
            handleDataOrPromise(
                loopUntilEndOrPromise(
                    theArray,
                    state,
                    onData
                ),
                abortRequested => {
                    if (abortRequested) {
                        state.mustAbort = true
                    }
                    onEnd(limited || state.mustAbort, null)

                },
            )
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
