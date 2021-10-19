import {
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { number, object } from 'yup';
import { addMinutes } from 'date-fns/fp';
import { useFormik } from 'formik';
import { useWallet } from '../../../wallet/hooks';
import { useCfmmStorage, useUserBalance } from '../../../api/queries';

import { AddLiquidityParams } from '../../../interfaces';
import { ADD_BTN_TXT, IAddLiquidityForm, TAddBtnTxt } from '../../../constants/liquidity';
import { addLiquidity, cfmmError } from '../../../contracts/cfmm';
import { logger } from '../../../utils/logger';
import { BUTTON_TXT } from '../../../constants/swap';
import Button from '../../button/Button';
import { useAppSelector } from '../../../redux/store';
import { useTxLoader } from '../../../hooks/utilHooks';

const AddLiquidity: React.FC = () => {
  const [{ pkh: userAddress }] = useWallet();
  const [maxTokens, setMaxToken] = useState(0);
  const [minLQT, setMinLQT] = useState(0);
  const [buttonText, setButtonText] = useState<TAddBtnTxt>(BUTTON_TXT.ENTER_AMT);
  const { data: cfmmStorage } = useCfmmStorage();
  const { data: balance } = useUserBalance(userAddress);
  const { t } = useTranslation();
  const toast = useToast();
  const text2 = useColorModeValue('text2', 'darkheading');
  const text4 = useColorModeValue('text4', 'darkheading');
  const text4Text4 = useColorModeValue('text4', 'text4');
  const inputbg = useColorModeValue('darkheading', 'textboxbg');
  const { slippage, deadline: deadlineFromStore } = useAppSelector((state) => state.trade);
  const handleProcessing = useTxLoader();

  const calcMaxToken = useCallback(
    (cashDeposited: number) => {
      if (cfmmStorage) {
        const { tokenPool, cashPool, lqtTotal } = cfmmStorage;
        const cash = cashDeposited * 1e6;
        const max =
          Math.ceil(((cash * tokenPool.toNumber()) / cashPool.toNumber()) * (1 + slippage * 0.01)) /
          1e6;
        setMaxToken(Number(max.toFixed(6)));
        const minLQTMinted =
          ((cash * lqtTotal.toNumber()) / cashPool.toNumber()) * (1 - slippage * 0.01);
        setMinLQT(Number(Math.floor(minLQTMinted).toFixed()));
      } else {
        setMaxToken(-1);
        setMinLQT(-1);
      }
    },
    [cfmmStorage, slippage],
  );

  const initialValues: any = {
    slippage: Number(slippage),
    deadline: Number(deadlineFromStore),
    amount: undefined,
  };

  const validationSchema = object().shape({
    slippage: number().min(0).optional(),
    deadline: number().min(0).optional(),
    amount: number()
      .min(0.000001, `${t('shouldMinimum')} 0.000001`)
      .positive(t('shouldPositive'))
      .required(t('required')),
  });

  const handleFormSubmit = async (formData: IAddLiquidityForm) => {
    if (userAddress && formData.amount) {
      try {
        const deadline = addMinutes(deadlineFromStore)(new Date());
        const data: AddLiquidityParams = {
          deadline,
          amount: formData.amount,
          owner: userAddress,
          maxTokensDeposited: maxTokens,
          minLqtMinted: minLQT,
        };
        const result = await addLiquidity(data);
        handleProcessing(result);
      } catch (error) {
        logger.error(error);
        const errorText = cfmmError[error.data[1].with.int as number] || t('txFailed');
        toast({
          description: errorText,
          status: 'error',
        });
      }
    }
  };

  const { values, handleChange, handleSubmit, isSubmitting } = useFormik({
    initialValues,
    validationSchema,
    onSubmit: handleFormSubmit,
  });

  useEffect(() => {
    calcMaxToken(Number(values.amount));
  }, [calcMaxToken, values.amount]);

  useEffect(() => {
    if (!userAddress) {
      setButtonText(ADD_BTN_TXT.CONNECT);
    } else if (values.amount) {
      setButtonText(ADD_BTN_TXT.ADD_LIQ);
    } else {
      setButtonText(ADD_BTN_TXT.ENTER_AMT);
    }
  }, [buttonText, userAddress, values.amount]);

  return (
    <form onSubmit={handleSubmit} id="add-liquidity-form">
      <Stack spacing={2}>
        <Text color={text2}>Add liquidity</Text>

        <Flex alignItems="center" justifyContent="space-between">
          <FormControl
            display="flex"
            flexDirection="column"
            id="to-input-amount"
            mt={-2}
            mb={6}
            w="45%"
          >
            <FormLabel color={text2} fontSize="xs">
              tez to deposit
            </FormLabel>
            <Input
              type="number"
              name="amount"
              id="amount"
              placeholder="0.0"
              color={text4}
              bg={inputbg}
              value={values.amount}
              onChange={handleChange}
            />
            <Text color={text4Text4} fontSize="xs" mt={1}>
              Balance: {balance?.xtz}
            </Text>
          </FormControl>

          <Flex mt={-2} mb={6}>
            <Icon as={MdAdd} />
          </Flex>

          <FormControl id="to-input-amount" mt={-2} mb={6} w="45%">
            <FormLabel color={text2} fontSize="xs">
              ctez to deposit(approx)
            </FormLabel>
            <Input
              value={maxTokens}
              readOnly
              border={0}
              color={text4}
              placeholder="0.0"
              type="number"
            />
            <Text color={text4Text4} fontSize="xs" mt={1}>
              Balance: {balance?.ctez}
            </Text>
          </FormControl>
        </Flex>

        <Button w="100%" variant="outline" type="submit" isLoading={isSubmitting}>
          {buttonText}
        </Button>
      </Stack>
    </form>
  );
};

export default AddLiquidity;
