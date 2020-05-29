
import { Stream } from "./Stream"
import * as api from "pareto-api"
import { result } from "../values/SafeValue"
import { wrap } from "../wrap"
import { IStream } from "./IStream"
//import * as fs from "fs"

// const rs  = fs.createReadStream("./foo.txt", {encoding: "utf-8"})
// rs.on("data", data => {
//     console.log(data)
// })
// rs.on("end")

type State = {
    index: number
    mustAbort: boolean
}

function loopUntilEndOrPromise<ElementType>(
    array: ElementType[],
    state: State,
    onData: (data: ElementType) => api.IValue<boolean>,
): api.IValue<boolean> {
    while (true) {
        if (state.mustAbort) {
            return result(true)
        }
        if (state.index === array.length) {
            return result(false) //end reached
        }
        const onDataResult = onData(array[state.index])
        state.index += 1

        return wrap.Value(onDataResult).mapResult(mustAbort => {
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

function pushData<ElementType>(
    theArray: ElementType[],
    onData: (data: ElementType) => api.IValue<boolean>,
    onEnd: (aborted: boolean, endData: null) => void,
    isLimited: boolean
): void {
    const state: State = {
        index: 0,
        mustAbort: false,
    }
    wrap.Value(loopUntilEndOrPromise(
        theArray,
        state,
        onData
    )).handle(
        aborted => {
            if (aborted || isLimited) {
                return onEnd(true, null)
            } else {
                return onEnd(false, null)
            }
        }
    )

}

export function streamifyArray<ElementType>(
    array: ElementType[],
): IStream<ElementType, null> {
    return new Stream((
        limiter: null | api.StreamLimiter,
        onData: (data: ElementType) => api.IValue<boolean>,
        onEnd: (aborted: boolean, endData: null) => void
    ): void => {
        if (limiter !== null && limiter.maximum < array.length) {
            if (limiter.abortEarly) {
                onEnd(true, null)
            } else {
                pushData(array.slice(0, limiter.maximum), onData, onEnd, true)
            }
        } else {
            pushData(array, onData, onEnd, false)
        }
    })
}
