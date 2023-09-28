import { ConfigService } from "../../services/config.service";

Service({
    name: 'loginService',
    DI: [ConfigService]
})
export function LoginService(configService) {

    this.generateOfflineToken = function() {
        return {
            bearer: "LOCAL_BEARER",
            expires_at: (+new Date) + (60 * 60 * 24 * 1000) // prior to 1day
        };
    }
}

LoginService.prototype.offlineLogin = function(credentials) {
    return new Promsise((resolve, reject) => {
        this.configService.getConfig({
            fields: "GET(config.userData), GET(config.loginInfo)"
        }).then((res) => {
            var details = res.first();
            if (details.loginInfo.email && (credentials.email == details.loginInfo.email) && (credentials.password == details.loginInfo.password)) {
                resolve({
                    userData: details.userData,
                    accessToken: this.generateOfflineToken()
                });
            } else {
                reject({
                    message: "Invalid login details"
                });
            }
        })
    })
};