# Mine every 5 second
while :
do
        echo -ne "\r"
        sleep 5
        ./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 1 bcrt1qc8mq892vw5hhgdn8ytkajsdxzkfy246fr30tsw
        echo -en "\r                          "
done
