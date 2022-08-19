export interface IServiceHealth {
    name: string,
    url: string,
    status: boolean,
    info: string,
}

export interface IWSHealthCheck {
    walletServerVersion: string,
    servicesHealth: IServiceHealth[]
}