// To parse this data:
//
//   import { Convert, PostRequest, UserInfo, SessionStartRequest, SessionEndRequest, ViewStartRequest, ViewEndRequest, ActionRequest } from "./file";
//
//   const postRequest = Convert.toPostRequest(json);
//   const userInfo = Convert.toUserInfo(json);
//   const sessionStartRequest = Convert.toSessionStartRequest(json);
//   const sessionEndRequest = Convert.toSessionEndRequest(json);
//   const viewStartRequest = Convert.toViewStartRequest(json);
//   const viewEndRequest = Convert.toViewEndRequest(json);
//   const actionRequest = Convert.toActionRequest(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface PostRequest {
    data: Data;
    type: PostRequestType;
}

export interface Data {
    fingerprint?: string;
    id:           string;
    isActive?:    boolean;
    referrer?:    string;
    timestamp:    number;
    type?:        DataType;
    userAgent:    string;
    userOrigin:   string;
    actionCount?: number;
    timeSpent?:   number;
    viewCount?:   number;
    path?:        string;
    sessionId?:   string;
    title?:       string;
    url?:         string;
    target?:      string;
}

export enum DataType {
    Click = "CLICK",
    FormSubmit = "FORM_SUBMIT",
    Synthetics = "SYNTHETICS",
    User = "USER",
}

export enum PostRequestType {
    Action = "ACTION",
    SessionEnd = "SESSION_END",
    SessionStart = "SESSION_START",
    ViewEnd = "VIEW_END",
    ViewStart = "VIEW_START",
}

export interface UserInfo {
    userAgent:  string;
    userOrigin: string;
}

export interface SessionStartRequest {
    fingerprint: string;
    id:          string;
    isActive:    boolean;
    referrer?:   string;
    timestamp:   number;
    type:        SessionStartRequestType;
    userAgent:   string;
    userOrigin:  string;
}

export enum SessionStartRequestType {
    Synthetics = "SYNTHETICS",
    User = "USER",
}

export interface SessionEndRequest {
    actionCount: number;
    fingerprint: string;
    id:          string;
    isActive:    boolean;
    referrer?:   string;
    timeSpent:   number;
    timestamp:   number;
    type:        SessionStartRequestType;
    userAgent:   string;
    userOrigin:  string;
    viewCount:   number;
}

export interface ViewStartRequest {
    id:         string;
    path:       string;
    referrer?:  string;
    sessionId:  string;
    timestamp:  number;
    title?:     string;
    url:        string;
    userAgent:  string;
    userOrigin: string;
}

export interface ViewEndRequest {
    id:         string;
    path:       string;
    referrer?:  string;
    sessionId:  string;
    timeSpent:  number;
    timestamp:  number;
    title?:     string;
    url:        string;
    userAgent:  string;
    userOrigin: string;
}

export interface ActionRequest {
    id:         string;
    sessionId:  string;
    target?:    string;
    timestamp:  number;
    type:       ActionRequestType;
    userAgent:  string;
    userOrigin: string;
}

export enum ActionRequestType {
    Click = "CLICK",
    FormSubmit = "FORM_SUBMIT",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toPostRequest(json: string): PostRequest {
        return cast(JSON.parse(json), r("PostRequest"));
    }

    public static postRequestToJson(value: PostRequest): string {
        return JSON.stringify(uncast(value, r("PostRequest")), null, 2);
    }

    public static toUserInfo(json: string): UserInfo {
        return cast(JSON.parse(json), r("UserInfo"));
    }

    public static userInfoToJson(value: UserInfo): string {
        return JSON.stringify(uncast(value, r("UserInfo")), null, 2);
    }

    public static toSessionStartRequest(json: string): SessionStartRequest {
        return cast(JSON.parse(json), r("SessionStartRequest"));
    }

    public static sessionStartRequestToJson(value: SessionStartRequest): string {
        return JSON.stringify(uncast(value, r("SessionStartRequest")), null, 2);
    }

    public static toSessionEndRequest(json: string): SessionEndRequest {
        return cast(JSON.parse(json), r("SessionEndRequest"));
    }

    public static sessionEndRequestToJson(value: SessionEndRequest): string {
        return JSON.stringify(uncast(value, r("SessionEndRequest")), null, 2);
    }

    public static toViewStartRequest(json: string): ViewStartRequest {
        return cast(JSON.parse(json), r("ViewStartRequest"));
    }

    public static viewStartRequestToJson(value: ViewStartRequest): string {
        return JSON.stringify(uncast(value, r("ViewStartRequest")), null, 2);
    }

    public static toViewEndRequest(json: string): ViewEndRequest {
        return cast(JSON.parse(json), r("ViewEndRequest"));
    }

    public static viewEndRequestToJson(value: ViewEndRequest): string {
        return JSON.stringify(uncast(value, r("ViewEndRequest")), null, 2);
    }

    public static toActionRequest(json: string): ActionRequest {
        return cast(JSON.parse(json), r("ActionRequest"));
    }

    public static actionRequestToJson(value: ActionRequest): string {
        return JSON.stringify(uncast(value, r("ActionRequest")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "PostRequest": o([
        { json: "data", js: "data", typ: r("Data") },
        { json: "type", js: "type", typ: r("PostRequestType") },
    ], false),
    "Data": o([
        { json: "fingerprint", js: "fingerprint", typ: u(undefined, "") },
        { json: "id", js: "id", typ: "" },
        { json: "isActive", js: "isActive", typ: u(undefined, true) },
        { json: "referrer", js: "referrer", typ: u(undefined, "") },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "type", js: "type", typ: u(undefined, r("DataType")) },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
        { json: "actionCount", js: "actionCount", typ: u(undefined, 3.14) },
        { json: "timeSpent", js: "timeSpent", typ: u(undefined, 3.14) },
        { json: "viewCount", js: "viewCount", typ: u(undefined, 3.14) },
        { json: "path", js: "path", typ: u(undefined, "") },
        { json: "sessionId", js: "sessionId", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "url", js: "url", typ: u(undefined, "") },
        { json: "target", js: "target", typ: u(undefined, "") },
    ], false),
    "UserInfo": o([
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
    ], false),
    "SessionStartRequest": o([
        { json: "fingerprint", js: "fingerprint", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "isActive", js: "isActive", typ: true },
        { json: "referrer", js: "referrer", typ: u(undefined, "") },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "type", js: "type", typ: r("SessionStartRequestType") },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
    ], false),
    "SessionEndRequest": o([
        { json: "actionCount", js: "actionCount", typ: 3.14 },
        { json: "fingerprint", js: "fingerprint", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "isActive", js: "isActive", typ: true },
        { json: "referrer", js: "referrer", typ: u(undefined, "") },
        { json: "timeSpent", js: "timeSpent", typ: 3.14 },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "type", js: "type", typ: r("SessionStartRequestType") },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
        { json: "viewCount", js: "viewCount", typ: 3.14 },
    ], false),
    "ViewStartRequest": o([
        { json: "id", js: "id", typ: "" },
        { json: "path", js: "path", typ: "" },
        { json: "referrer", js: "referrer", typ: u(undefined, "") },
        { json: "sessionId", js: "sessionId", typ: "" },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "url", js: "url", typ: "" },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
    ], false),
    "ViewEndRequest": o([
        { json: "id", js: "id", typ: "" },
        { json: "path", js: "path", typ: "" },
        { json: "referrer", js: "referrer", typ: u(undefined, "") },
        { json: "sessionId", js: "sessionId", typ: "" },
        { json: "timeSpent", js: "timeSpent", typ: 3.14 },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "title", js: "title", typ: u(undefined, "") },
        { json: "url", js: "url", typ: "" },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
    ], false),
    "ActionRequest": o([
        { json: "id", js: "id", typ: "" },
        { json: "sessionId", js: "sessionId", typ: "" },
        { json: "target", js: "target", typ: u(undefined, "") },
        { json: "timestamp", js: "timestamp", typ: 3.14 },
        { json: "type", js: "type", typ: r("ActionRequestType") },
        { json: "userAgent", js: "userAgent", typ: "" },
        { json: "userOrigin", js: "userOrigin", typ: "" },
    ], false),
    "DataType": [
        "CLICK",
        "FORM_SUBMIT",
        "SYNTHETICS",
        "USER",
    ],
    "PostRequestType": [
        "ACTION",
        "SESSION_END",
        "SESSION_START",
        "VIEW_END",
        "VIEW_START",
    ],
    "SessionStartRequestType": [
        "SYNTHETICS",
        "USER",
    ],
    "ActionRequestType": [
        "CLICK",
        "FORM_SUBMIT",
    ],
};
