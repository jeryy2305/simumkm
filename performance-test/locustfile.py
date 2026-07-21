from locust import HttpUser, task, between


class UMKMSystemUser(HttpUser):

    wait_time = between(1, 3)

    token = None


    def on_start(self):

        response = self.client.post(
            "/api/login",
            json={
                "email": "admin@example.com",
                "password": "password"
            }
        )

        if response.status_code == 200:
            self.token = response.json()["token"]


    def auth_header(self):

        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json"
        }


    @task(5)
    def lihat_produk(self):

        self.client.get(
            "/api/products",
            headers=self.auth_header()
        )


    @task(3)
    def lihat_umkm(self):

        self.client.get(
            "/api/umkms",
            headers=self.auth_header()
        )


    @task(2)
    def dashboard_admin(self):

        self.client.get(
            "/api/admin/dashboard/stats",
            headers=self.auth_header()
        )


    @task(2)
    def lihat_penitipan(self):

        self.client.get(
            "/api/consignments",
            headers=self.auth_header()
        )