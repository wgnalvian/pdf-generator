
export type PayloadIjazahUser = {
    templateId: string;
    userId: string;
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