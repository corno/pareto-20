import * as chai from "chai"
import * as sa from "../../src/array/createArray"
import { wrapSafeFunction, result, wrap } from "../../src"


describe("stringfyArray", () => {
    it("sync normal", () => {
        return testStreamifiedArray(null, [1, 2, 3, 4, 5, 6, 7, 8, 9], null, [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it("async normal", () => {
        return testStreamifiedArray(null, [1, 2, 3, 4, 5, 6, 7, 8, 9], null, [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it("sync aborted", () => {
        return testStreamifiedArray(5, [1, 2, 3, 4, 5, 6, 7, 8, 9], 5, [1, 2, 3, 4, 5, null])
    })
    it("async aborted", () => {
        return testStreamifiedArray(5, [1, 2, 3, 4, 5, 6, 7, 8, 9], 5, [1, 2, 3, 4, 5, null])
    })
    it("sync large", () => {
        const theArray: number[] = []
        for (let i = 0; i !== 300000; i += 1) {
            theArray.push(i)
        }
        return testStreamifiedArray(null, theArray, null, theArray)
    })
    it("async large", () => {
        const theArray: number[] = []
        for (let i = 0; i !== 300000; i += 1) {
            theArray.push(i)
        }
        return testStreamifiedArray(0, theArray, null, theArray)
    })
})

function testStreamifiedArray(timeout: null | number, theArray: number[], abortOn: number | null, expected: (number | null)[]) {
    const out: (number | null)[] = []

    return wrap.UnsafeValue(sa.createArray(
        theArray,
    ).streamify().toUnsafeValue(
        null,
        data => {
            //console.log(data)
            out.push(data)
            if (data === abortOn) {
                return result(true)
            }
            if (timeout !== null) {
                return wrapSafeFunction<boolean>(onResult => {
                    if (timeout === 0) {
                        new Promise(resolve => {
                            resolve()
                        }).then(() => {
                            try {
                                onResult(false)

                            }
                            catch (e) {
                                console.error("unexpected exception", e)
                                throw e
                            }
                        }).catch(() => {
                            throw new Error("unexpected")
                        })
                    } else {
                        setTimeout(
                            () => {
                                onResult(false)
                            },
                            Math.random() * 10
                        )
                    }
                })
            } else {
                return result(false)
            }
        },
        aborted => {
            //
            if (aborted) {
                out.push(null)
            }
            return result(null)
        }
    )).reworkAndCatch(
        () => {
            chai.assert.deepEqual(out, expected)
            return result(null)
        },
        () => {
            chai.assert.deepEqual(out, expected)
            return result(null)
        }
    ).convertToNativePromise()
}
