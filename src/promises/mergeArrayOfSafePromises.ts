import { SafePromise } from "./SafePromise"
import { IInSafePromise } from "pareto-api"

export function mergeArrayOfSafePromises<ResultType>(
    array: IInSafePromise<ResultType>[],
): SafePromise<ResultType[]> {
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
                    element.handleSafePromise(
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
    return new SafePromise<ResultType[]>(execute)
}