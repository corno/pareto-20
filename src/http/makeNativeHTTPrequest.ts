import * as http from "http"
import { wrapUnsafeFunction } from "../value/createUnsafeValue"
import { createStream } from "../stream/createStream"
import { IStream } from "../stream/IStream"
import { IUnsafeValue } from "../value/IUnsafeValue"

export type HTTPOptions = {
    host: string
    path: string
    timeout: number
}

export function makeNativeHTTPrequest(
    options: HTTPOptions
): IUnsafeValue<IStream<string, null>, string> {
    return wrapUnsafeFunction((onError, onSucces) => {

        const request = http.request(
            {
                host: options.host,
                path: options.path,
                timeout: options.timeout,
            },
            res => {
                if (res.statusCode !== 200) {
                    onError(`'${options.path}' not found`)
                    return
                }
                //below code is streaming but unstable
                // onSucces(p20.createStream((_limiter, consumer) => {
                //     res.on('data', chunk => {
                //         res.pause()
                //         consumer.onData(chunk.toString()).handle(
                //             _abortRequested => {
                //                 res.resume()
                //             }
                //         )
                //     })
                //     res.on('end', () => {
                //         consumer.onEnd(false, null)
                //     })
                // }))

                let complete = ""
                onSucces(createStream((_limiter, consumer) => {
                    res.on(
                        'data',
                        chunk => {
                            complete += chunk.toString() //eslint-disable-line
                        }
                    )
                    res.on('end', () => {

                        consumer.onData(complete).handle(
                            _abortRequested => {
                                //
                                consumer.onEnd(false, null)
                            }
                        )
                    })
                }))
            }
        )
        request.on('timeout', () => {
            console.error("timeout")
            onError("timeout")
        });
        request.on('error', e => {
            console.error(e.message)
            onError(e.message)
        });
        request.end()
    })
}
