import * as api from "pareto-api"
import { IUnsafePromise } from "./IUnsafePromise"
import { UnsafePromise } from "./UnsafePromise"


export function mergeArrayOfUnsafePromises<ResultType, ErrorType>(
    array: api.IUnsafePromise<ResultType, ErrorType>[]
): IUnsafePromise<ResultType[], ErrorType[]> {
    let isExecuted = false
    function execute(onErrors: (errors: ErrorType[]) => void, onSuccess: (results: ResultType[]) => void) {
        if (isExecuted === true) {
            throw new Error("all promise is already executed")
        }
        isExecuted = true
        let resolvedCount = 0
        const results: ResultType[] = []
        const errors: ErrorType[] = []

        function wrapup() {

            if (resolvedCount > array.length) {
                const err = new Error("promises are called back more than once")
                throw err
            }
            if (resolvedCount === array.length) {
                if (errors.length > 0) {
                    onErrors(errors)
                } else {
                    onSuccess(results)
                }
            }
        }
        if (array.length === 0) {
            wrapup()
        } else {
            array.forEach((element, index) => {
                (() => {
                    element.handleUnsafePromise(
                        error => {
                            errors.push(error)
                            resolvedCount += 1
                            wrapup()
                        },
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
    return new UnsafePromise(execute)
}