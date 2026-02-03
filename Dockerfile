docker build -t tiangong-ops:v1 .

docker run -d \
  -p 80:80 \
  -e DB_HOST=192.168.1.50 \
  -e DB_USER=ops_admin \
  -e DB_PASSWORD=your_secure_password \
  -e DB_NAME=tiangong_ops_db \
  --name tiangong-app \
  tiangong-ops:v1
