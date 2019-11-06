// tslint:disable: no-console
import { UnsafeMutableDictionary } from "../dictionaries/UnsafeMutableDictionary"
import { success } from "../promises/UnsafePromise"

const dict = new UnsafeMutableDictionary<string, string, string, null>(
    data => success<string, null>(data),
    data => data,
    data => data,
    _data => {}
)

console.log(dict)


dict.createEntry("TEST", "foo").handleUnsafePromise(
    error => {
        console.log(error)
    },
    _success => {
        console.log("SUCCESS")
    }
)
