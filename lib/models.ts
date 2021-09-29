import { Argument, Tag } from '@wdio/reporter';


export interface BrowserData {
    browser: {
        name: string;
        version: string;
    };
}

export interface AppData{
    app?: {
        name: string;
        version: string;
    };
}

export interface MetadataObject {
    app?: {
        name: string;
        version: string;
    };
    browser?: {
        name: string;
        version: string;
    };
    device?: string;
    platform?: {
        name: string;
        version: string;
    };
    keyword?: string;
    type?: string;
    foo?: string;
}


export interface Report {
    feature: Feature;
}

export interface FeatureMetadata {
    keyword: string;
    type: string;
}

export interface Feature {
    report?: {
        keyword: string;
    };
    keyword?: string;
    type?: string;
    metadata?: MetadataObject;
    description?: string;
    line?: number | null;
    name?: string;
    uri?: string;
    tags?: string[] | Tag[] | string;
    elements?: Scenario[];
    id?: string;
}

export interface Scenario {
    keyword?: string;
    type?: string;
    description?: string;
    name?: string;
    tags?: string[] | Tag[] | string;
    id?: string;
    steps?: Step[];
    foo?: string;
    bar?: string;
    foobar?: string;
}

export interface Step {
    arguments?: ( string | Argument )[];
    keyword?: string;
    name?: string;
    result?: {
        status: string;
        duration: number;
        error_message?: string;
    };
    line?: number | null;
    match?: {
        location: number | string;
    };
    embeddings?: Embedding[];
    foo?: string;
}

export interface Result extends ErrorMessage {
    status: string;
    duration: number;
}

export interface CucumberJsAttachment {
    data: string;
    type: string;
}

export interface Embedding {
    data: string;
    mime_type: string;
}

export interface ErrorMessage {
    error_message?: string;
}

export interface cjson_metadata {
    browser?: {
        name: string;
        version: string;
    };
    device?: string;
    app?: {
        name: string;
        version: string;
    };
    platform?: {
        name: string;
        version: string;
    };
}
