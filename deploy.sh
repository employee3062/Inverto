#!/bin/bash
aws cloudformation deploy \
  --stack-name inverto-stack \
  --template-file ./aws/architecture.yaml \
  --parameter-overrides file://./aws/params.json \
  --capabilities CAPABILITY_NAMED_IAM
