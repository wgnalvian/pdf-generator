
export type Payload = {
    templateId: string;
    name: string[];
    value: string[];
    exp: number;
};


export type UserIjazah = {
    id: string;
    name: string;
    email: string;
    urlIjazah: string;
    createdAt: Date;
    updatedAt: Date;
};

export type UserPreview = {
    id: string;
    name: string;
    email: string;
    isHavePassword: boolean;
    exp: Date;
    createdAt: Date;
    updatedAt: Date;
}