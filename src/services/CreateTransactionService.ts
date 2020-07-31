import { getRepository, getCustomRepository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_name: string;
}

class CreateTransactionService {
  public async execute({
    value,
    title,
    type,
    category_name,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid transaction');
    }

    const { total } = await transactionRepository.getBalance();

    if (total < value && type === 'outcome') {
      throw new AppError('You don´t have enough balance');
    }

    const category_id = await this.getCategory(category_name);

    const id = uuidv4();

    const transaction = transactionRepository.create({
      id,
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }

  private async getCategory(category_name: string): Promise<string> {
    const categoryRepository = getRepository(Category);
    const checkCategory = await categoryRepository.findOne({
      where: {
        title: category_name,
      },
    });

    if (!checkCategory) {
      const newCategory = await categoryRepository.create({
        title: category_name,
      });
      await categoryRepository.save(newCategory);
      return newCategory.id;
    }
    return checkCategory.id;
  }
}

export default CreateTransactionService;
