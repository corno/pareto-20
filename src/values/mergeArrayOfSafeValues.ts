import * as api from "pareto-api"
import { Value } from "./SafeValue"

export function mergeArrayOfSafeValues<ResultType>(
    array: api.IValue<ResultType>[],
): Value<ResultType[]> {
    let isExecuted = false
    function execute(onResult: (results: ResultType[]) => void) {
        if (isExecuted === true) {
            throw new Error("all promise is already executed")
        }
        isExecuted = true
        let resolvedCount = 0
        const results: ResultType[] = []

        function wrapup() {

            if (resolvedCount > array.length) {
                throw new Error("promises are called back more than once")
            }
            if (resolvedCount === array.length) {
                onResult(results)
            }
        }
        if (array.length === 0) {
            wrapup()
        } else {
            array.forEach((element, index) => {
                (() => {
                    element.handle(
                        result => {
                            results[index] = result
                            resolvedCount += 1
                            wrapup()
                        }
                    )
                })()
            })
        }
    }
    return new Value<ResultType[]>(execute)
}