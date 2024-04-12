import phonesList from "./phonesList.json";

// Generate Device ID
const generateRandomString = (length: number) => {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const getUserInfo = (userData: Record<string, any>) => {
    const info = {
        name: userData['name'] || 'Unknown',
        gender: userData['gender'] || 'Unknown',
        about: userData['about'] || '',
        image: userData['image'] || null,
        internetAddresses: userData['internetAddresses'] || [],
        phones: userData['phones'] || []
    }

    return info;
}

const verifyOTP = async (requestId: string, phoneNumber: any, token: string, domain = 'noneu'): Promise<any> => {
    try {
        const postData = {
            countryCode: phoneNumber.regionCode,
            dialingCode: phoneNumber.countryCode,
            phoneNumber: phoneNumber.number,
            requestId,
            token
        };

        const options = {
            method: "POST",
            headers: {
                "content-type": "application/json; charset=UTF-8",
                "accept-encoding": "gzip",
                "user-agent": "Truecaller/11.75.5 (Android;10)",
                "clientsecret": "lvc22mp3l1sfv6ujg83rd17btt",
            },
            // url: "https://account-asia-south1.truecaller.com/v1/verifyOnboardingOtp",
            body: JSON.stringify(postData)
        };

        let result: { status: boolean, message: string, installationId?: string, errorData?: string | {} } = {
            status: false,
            message: ''
        }

        const response = await fetch(`https://account-${domain}.truecaller.com/v1/verifyOnboardingOtp`, options)
            .catch(error => {
                console.log('Error Message:', error.message || '');
                result.message = error.message;
                if (error.response) {
                    console.log('Response Error Data:', error.response.data);
                    result.errorData = error.response.data;
                }
                else if (error.request) {
                    console.log(error);
                    console.log('Request Error Data:', error.request.data);
                    result.errorData = error.request.data;
                }
            });

        if(!response) return result;

        const responseJSON = await response.json();

        if (!responseJSON) return result;

        if (responseJSON.suspended) {
            console.log('Account is suspended.');

            result.message = 'Account is suspended';
        }
        else if (responseJSON.status == 2 || 'installationId' in responseJSON) {
            console.log('Installation ID:', responseJSON.installationId);

            result.status = true;
            result.message = 'Verified';
            result.installationId = responseJSON.installationId;
        }
        else if (responseJSON.status == 11) {
            console.log('Invalid OTP');

            result.message = 'Invalid OTP';
        }
        else if ('message' in responseJSON) {
            console.log('Message:', responseJSON.message);

            result.message = responseJSON.message;
        }

        return result;
    }
    catch (error) {
        console.log(error);

        return {
            status: false,
            message: error instanceof Error ? error.message : error
        }
    }
}

const sendOTP = async (phoneNumber: any, domain = 'noneu'): Promise<any> => {
    try {
        const data = {
            countryCode: phoneNumber.regionCode,
            dialingCode: phoneNumber.countryCode,
            installationDetails: {
                app: {
                    buildVersion: 5,
                    majorVersion: 11,
                    minorVersion: 7,
                    store: "GOOGLE_PLAY",
                },
                device: {
                    deviceId: generateRandomString(16),
                    language: "en",
                    manufacturer: phonesList[Math.floor(Math.random() * phonesList.length)].manufacturer,
                    model: phonesList[Math.floor(Math.random() * phonesList.length)].model,
                    osName: "Android",
                    osVersion: "10",
                    mobileServices: ["GMS"],
                },
                language: "en",
            },
            phoneNumber: phoneNumber.number,
            region: domain === 'noneu' ? "region-2" : "region-1",
            sequenceNo: 2,
        };

        console.log(data.countryCode, data.dialingCode, data.phoneNumber);

        const options = {
            method: "POST",
            headers: {
                "content-type": "application/json; charset=UTF-8",
                "accept-encoding": "gzip",
                "user-agent": "Truecaller/11.75.5 (Android;10)",
                "clientsecret": "lvc22mp3l1sfv6ujg83rd17btt",
            },
            body: JSON.stringify(data)
        };
        
        let result: { status: boolean, message: string, requestId?: string, errorData?: string | {}, domain?: string } = {
            status: false,
            message: ''
        };
        
        let wrongDomain = false;
        let newDomain = domain;
        
        const response = await fetch(`https://account-${domain}.truecaller.com/v2/sendOnboardingOtp`, options)
            .catch(error => {
                console.log('Error Message:', error.message || '');
                result.message = error.message;
                if (error.response) {
                    console.log('Response Error Data:', error.response.data);
                    result.errorData = error.response.data;

                    if (error.response.data.status && error.response.data.status == 45101) {
                        console.log('Wrong domain');
                        wrongDomain = true;
                        newDomain = error.response.data.domain;
                    }
                }
                else if (error.request) {
                    console.log(error);
                    console.log('Request Error Data:', error.request.data);
                    result.errorData = error.request.data;
                }
            });

        if (wrongDomain) {
            await sleep(2000);
            return await sendOTP(phoneNumber, newDomain);
        }

        result.domain = newDomain;
        
        if(!response) return result;

        const responseJSON = await response?.json();

        if (!responseJSON) return result;

        if (responseJSON.status == 1 || responseJSON.status == 9 || responseJSON.message == 'Sent') {
            console.log('OTP token sent');

            result.status = true;
            result.message = 'OTP token sent';
            result.requestId = responseJSON.requestId;
        }
        else if (responseJSON.status == 5 || responseJSON.status == 6) {
            console.log('Verification attempts limit exceeded. Please try again after some time')

            result.message = 'Verification attempts limit exceeded. Please try again after some time';
        }
        else if (responseJSON.status == 4) {
            console.log('Request id limit reached');
            await sleep(2000);

            return await sendOTP(phoneNumber, domain);
        }
        else {
            console.log(responseJSON.message);
            result.message = responseJSON.message;
        }

        return result;
    }
    catch (error) {
        console.log(error);

        return {
            status: false,
            message: error instanceof Error ? error.message : error
        }
    }
}

const searchNumber = async (phoneNumber: any, installationId: string, domain = 'noneu'): Promise<any> => {
    try {
        let result: { status: boolean, message: string, data: any, errorData?: string | {} } = {
            status: false,
            message: '',
            data: []
        };

        let wrongDomain = false;
        let newDomain = domain;

        const params = new URLSearchParams({
            q: phoneNumber.number,
            countryCode: phoneNumber.regionCode,
            type: '4',
            locAddr: "",
            placement: "SEARCHRESULTS,HISTORY,DETAILS",
            encoding: "json",
        }).toString();

        const res = await fetch(`https://search5-${domain}.truecaller.com/v2/search?` + params , {
            headers: {
                "content-type": "application/json; charset=UTF-8",
                "accept-encoding": "gzip",
                "user-agent": "Truecaller/11.75.5 (Android;10)",
                Authorization: `Bearer ${installationId}`,
            }
        })
            .catch((error) => {
                console.log('Error message:', error.message);
                result.message = error.message;
                if (error.response) {
                    console.log('Response error data:', error.response.data);
                    result.errorData = error.response.data;

                    if (error.response.data.status && error.response.data.status == 45101) {
                        console.log('Wrong domain');
                        wrongDomain = true;
                        newDomain = domain === 'noneu' ? 'eu' : 'noneu';
                    }
                }
                else if (error.request) {
                    console.log('Request error data:', error.request.data);
                    result.errorData = error.request.data;
                }

            });

        if (wrongDomain) {
            await sleep(2000);
            return await searchNumber(phoneNumber, installationId, newDomain);
        }

        if(!res) return result;

        const resJSON = await res.json();

        if (!resJSON) return result;

        result.status = true;
        result.data = resJSON;

        return result;
    }
    catch (error) {
        console.log(error);
        return {
            status: false,
            message: error instanceof Error ? error.message : error
        }
    }
}

const bulkSearch = async (phoneNumbers: string, regionCode: string, installationId: string, domain = 'noneu'): Promise<any> => {
    try {
        let result: { status: boolean, message: string, data: any, errorData?: string | {} } = {
            status: false,
            message: '',
            data: []
        };

        let wrongDomain = false;
        let newDomain = domain;

        const params = new URLSearchParams({
            q: phoneNumbers,
            countryCode: regionCode,
            type: '14',
            placement: "SEARCHRESULTS,HISTORY,DETAILS",
            encoding: "json"
        }).toString();

        const res = await fetch(`https://search5-${domain}.truecaller.com/v2/bulk?` + params, {
            headers: {
                "content-type": "application/json; charset=UTF-8",
                "accept-encoding": "gzip",
                "user-agent": "Truecaller/11.75.5 (Android;10)",
                Authorization: `Bearer ${installationId}`,
            },
        })
            .catch(error => {
                console.log('Error message:', error.message);
                result.message = error.message;
                if (error.response) {
                    console.log('Response error data:', error.response.data);
                    result.errorData = error.response.data;

                    if (error.response.data.status && error.response.data.status == 45101) {
                        console.log('Wrong domain');
                        wrongDomain = true;
                        newDomain = domain === 'noneu' ? 'eu' : 'noneu';
                    }
                }
                else if (error.request) {
                    console.log('Request error data:', error.request.data);
                    result.errorData = error.request.data;
                }

            });

        if (wrongDomain) {
            await sleep(2000);
            return await bulkSearch(phoneNumbers, regionCode, installationId, newDomain);
        }

        if(!res) return result;

        const resJSON = await res.json();

        if (!resJSON) return result;

        return resJSON;
    }
    catch (error) {
        console.log(error);
        return {
            status: false,
            message: error instanceof Error ? error.message : error
        }
    }
}

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { searchNumber, bulkSearch, sendOTP, verifyOTP, getUserInfo }