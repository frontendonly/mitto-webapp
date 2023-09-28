export function createUserInfoStructure(profileData) {
    return Object.assign({}, {
        name: "",
        mobile: "",
        quote: "",
        style: "1",
        privacy: {
            circles: true,
            mobile: false,
            pm: true,
            blurimage: false,
            available: true,
            location: true,
            age: true,
            addById: true,
            addByMobileNumber: true,
        },
        gender: 1,
        date: +new Date,
        lastModified: +new Date,
        bytes: "",
        profileImage: "",
        age: 18,
        height: "",
        description: ""
    }, profileData);
}

